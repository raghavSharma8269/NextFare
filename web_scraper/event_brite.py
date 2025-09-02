from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time
import re
import json
import random
from database_utils import save_eventbrite_event

def setup_driver():
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service)
    return driver

def extract_coordinates_from_google_url(google_url):
    coords = re.search(r'daddr=([0-9.-]+),([0-9.-]+)', google_url)
    if coords:
        return coords.groups()
    return None, None

def get_events_from_listing_page(driver, website):
    driver.get(website)
    time.sleep(random.uniform(2, 4))
    
    events = driver.find_elements("xpath", '//a[@class="event-card-link "]')
    events_with_text = [event for event in events if event.text.strip()]
    
    print(f"Found {len(events_with_text)} unique events on this page")
    return events_with_text

def navigate_to_event_page(driver, event):
    main_window = driver.current_window_handle
    
    driver.execute_script("arguments[0].click();", event)
    time.sleep(2)
    
    all_windows = driver.window_handles
    if len(all_windows) > 1:
        for window in all_windows:
            if window != main_window:
                driver.switch_to.window(window)
                break
    
    return main_window

def close_event_tab_and_return_to_main(driver, main_window):
    current_window = driver.current_window_handle
    if current_window != main_window:
        driver.close()
        driver.switch_to.window(main_window)

def expand_directions_section(driver):
    try:
        expand_button = driver.find_element("xpath", '//button[@class="eds-btn eds-btn--link"]')
        driver.execute_script("arguments[0].click();", expand_button)
        time.sleep(1)
    except:
        pass

def extract_basic_event_details(driver):
    event_data = {}
    
    try:
        event_data['title'] = driver.find_element("xpath", '//h1[@class="event-title css-0"]').text
    except:
        event_data['title'] = None

    try:
        event_data['start_date'] = driver.find_element("xpath", '//time[@class="start-date"]').text
    except:
        event_data['start_date'] = None

    try:
        event_data['date_time'] = driver.find_element("xpath", '//span[@class="date-info__full-datetime"]').text
    except:
        event_data['date_time'] = None

    try:
        event_data['summary'] = driver.find_element("xpath", '//p[@class="summary"]').text
    except:
        event_data['summary'] = None

    try:
        event_data['address'] = driver.find_element("xpath", '//div[@class="location-info__address"]').text
    except:
        event_data['address'] = None

    try:
        event_data['image'] = driver.find_element("xpath", '//img[@data-testid="hero-img"]').get_attribute('src')
    except:
        event_data['image'] = None

    try:
        directions_url = driver.find_element("xpath", '//a[@aria-label="Driving directions"]').get_attribute('href')
        lat, lng = extract_coordinates_from_google_url(directions_url)
        event_data['directions_url'] = directions_url
        event_data['latitude'] = lat
        event_data['longitude'] = lng
    except:
        event_data['directions_url'] = None
        event_data['latitude'] = None
        event_data['longitude'] = None

    try:
        event_data['page_url'] = driver.current_url
    except:
        event_data['page_url'] = None
    
    return event_data

def extract_ticket_data(driver):
    try:
        script_content = driver.page_source
        
        start = script_content.find('window.__SERVER_DATA__ = ') + len('window.__SERVER_DATA__ = ')
        end = script_content.find('};', start) + 1
        
        if start > len('window.__SERVER_DATA__ = ') - 1:
            server_data_str = script_content[start:end]
            server_data = json.loads(server_data_str)
            
            ticket_classes = server_data['event_listing_response']['tickets']['ticketClasses']
            
            total_capacity = 0
            tickets_sold = 0
            ticket_status = []
            
            for ticket in ticket_classes:
                capacity = ticket.get('capacity', 0)
                remaining = ticket.get('quantityRemaining', 0)
                status = ticket.get('onSaleStatusEnum', '')
                
                total_capacity += capacity
                tickets_sold += (capacity - remaining)
                ticket_status.append(status)
            
            return {
                'total_capacity': total_capacity,
                'tickets_sold': tickets_sold,
                'tickets_remaining': total_capacity - tickets_sold,
                'ticket_statuses': ticket_status
            }
    except Exception as e:
        return None

def scrape_single_event(driver, event, main_window):
    try:
        navigate_to_event_page(driver, event)
        time.sleep(random.uniform(2, 4))
        
        expand_directions_section(driver)
        
        event_data = extract_basic_event_details(driver)
        ticket_data = extract_ticket_data(driver)
        
        success = save_eventbrite_event(event_data, ticket_data)
        
        if success:
            print(f"✓ Scraped and saved: {event_data.get('title', 'Unknown Event')}")
        else:
            print(f"✗ Failed to save: {event_data.get('title', 'Unknown Event')}")
        
        return success
        
    except Exception as e:
        print(f"Error scraping event: {e}")
        return False
    finally:
        close_event_tab_and_return_to_main(driver, main_window)
        time.sleep(random.uniform(1, 2))

def scrape_all_pages(driver, base_url, max_pages=5):
    total_scraped = 0
    total_saved = 0
    
    for page_num in range(1, max_pages + 1):
        print(f"\nSCRAPING PAGE {page_num}")
        
        website = f"{base_url}?page={page_num}"
        events_with_text = get_events_from_listing_page(driver, website)
        
        if not events_with_text:
            print(f"No events found on page {page_num}. Stopping.")
            break
        
        main_window = driver.current_window_handle
        
        for i, event in enumerate(events_with_text, 1):
            print(f"Scraping event {i}/{len(events_with_text)} on page {page_num}")
            
            success = scrape_single_event(driver, event, main_window)
            total_scraped += 1
            
            if success:
                total_saved += 1
            
            time.sleep(random.uniform(2, 4))
        
        print(f"Page {page_num} completed: {len(events_with_text)} events processed")
        time.sleep(random.uniform(3, 6))
    
    print(f"\nSCRAPING COMPLETED")
    print(f"Total events scraped: {total_scraped}")
    print(f"Total events saved to database: {total_saved}")

def main():
    base_url = 'https://www.eventbrite.com/d/ny--new-york--manhattan/events--today/'
    max_pages = 3
    
    driver = setup_driver()
    
    try:
        scrape_all_pages(driver, base_url, max_pages)
        
    except KeyboardInterrupt:
        print("\nScraping interrupted by user")
    except Exception as e:
        print(f"Unexpected error: {e}")
    finally:
        driver.quit()

if __name__ == "__main__":
    main()