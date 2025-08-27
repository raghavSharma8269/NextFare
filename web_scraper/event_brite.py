from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time
import re
import json


def setup_driver():
    """Initialize and return Chrome WebDriver."""
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service)
    return driver

def extract_coordinates_from_google_url(google_url):
    """Extract latitude and longitude from Google Maps directions URL."""
    coords = re.search(r'daddr=([0-9.-]+),([0-9.-]+)', google_url)
    if coords:
        return coords.groups()
    return None, None

def get_events_from_listing_page(driver, website):
    """Get list of events with text from the main listing page."""
    driver.get(website)
    time.sleep(1)
    
    events = driver.find_elements("xpath", '//a[@class="event-card-link "]')
    events_with_text = [event for event in events if event.text.strip()]
    
    print(f"Found {len(events_with_text)} unique events:")
    for i, event in enumerate(events_with_text):
        print(f"Event {i+1}: {event.text}")
        print(f"  Href: {event.get_attribute('href')}")
    
    return events_with_text


def navigate_to_event_page(driver, event):
    """Click on event and switch to new tab if opened."""
    original_window = driver.current_window_handle
    
    driver.execute_script("arguments[0].click();", event)
    time.sleep(2)
    
    # Switch to new tab if opened
    all_windows = driver.window_handles
    if len(all_windows) > 1:
        for window in all_windows:
            if window != original_window:
                driver.switch_to.window(window)
                break


def expand_directions_section(driver):
    """Expand the Get Directions section on event page."""
    try:
        expand_button = driver.find_element("xpath", '//button[@class="eds-btn eds-btn--link"]')
        driver.execute_script("arguments[0].click();", expand_button)
    except:
        print("Could not expand directions section")


def extract_basic_event_details(driver):
    """Extract basic event information from the page."""
    event_data = {}
    
    try:
        event_data['title'] = driver.find_element("xpath", '//h1[@class="event-title css-0"]').text
    except:
        event_data['title'] = "title not found"

    try:
        event_data['start_date'] = driver.find_element("xpath", '//time[@class="start-date"]').text
    except:
        event_data['start_date'] = "start date not found"

    try:
        event_data['date_time'] = driver.find_element("xpath", '//span[@class="date-info__full-datetime"]').text
    except:
        event_data['date_time'] = "date time not found"

    try:
        event_data['summary'] = driver.find_element("xpath", '//p[@class="summary"]').text
    except:
        event_data['summary'] = "summary not found"

    try:
        event_data['address'] = driver.find_element("xpath", '//div[@class="location-info__address"]').text
    except:
        event_data['address'] = "address not found"

    try:
        event_data['image'] = driver.find_element("xpath", '//img[@class="css-1mghjxa eyu62kx0"]').get_attribute('src')
    except:
        event_data['image'] = "img not found"

    try:
        directions_url = driver.find_element("xpath", '//a[@aria-label="Driving directions"]').get_attribute('href')
        lat, lng = extract_coordinates_from_google_url(directions_url)
        event_data['directions_url'] = directions_url
        event_data['latitude'] = lat
        event_data['longitude'] = lng
    except:
        event_data['directions_url'] = "url not found"
        event_data['latitude'] = None
        event_data['longitude'] = None

    try:
        event_data['page_url'] = driver.current_url
    except:
        event_data['page_url'] = "current url not found"
    
    return event_data


def extract_ticket_data(driver):
    """Extract ticket capacity and sales data from server data."""
    try:
        script_content = driver.page_source
        
        # Find the __SERVER_DATA__ section
        start = script_content.find('window.__SERVER_DATA__ = ') + len('window.__SERVER_DATA__ = ')
        end = script_content.find('};', start) + 1
        
        if start > len('window.__SERVER_DATA__ = ') - 1:
            server_data_str = script_content[start:end]
            server_data = json.loads(server_data_str)
            
            # Extract ticket information
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
        print(f"Could not extract ticket data: {e}")
        return None


def print_event_details(event_data, ticket_data):
    """Print all extracted event information."""
    print("\n" + "="*50)
    print("EVENT DETAILS")
    print("="*50)
    
    print(f"Event Title: {event_data['title']}")
    print(f"Event Start Date: {event_data['start_date']}")
    print(f"Event Date and Time: {event_data['date_time']}")
    print(f"Event Summary: {event_data['summary']}")
    print(f"Event Address: {event_data['address']}")
    print(f"Event Image URL: {event_data['image']}")
    print(f"Directions URL: {event_data['directions_url']}")
    print(f"Latitude: {event_data['latitude']}, Longitude: {event_data['longitude']}")
    print(f"Event Page URL: {event_data['page_url']}")
    
    if ticket_data:
        print("\nTICKET INFORMATION:")
        print(f"Total Capacity: {ticket_data['total_capacity']}")
        print(f"Tickets Sold: {ticket_data['tickets_sold']}")
        print(f"Tickets Remaining: {ticket_data['tickets_remaining']}")
        print(f"Ticket Statuses: {ticket_data['ticket_statuses']}")


def main():
    """Main function to orchestrate the scraping process."""
    website = 'https://www.eventbrite.com/d/ny--new-york--manhattan/events--today/?page=1'
    
    driver = setup_driver()
    
    try:
        events_with_text = get_events_from_listing_page(driver, website)
        
        if not events_with_text:
            print("No events found with text")
            return
        
        navigate_to_event_page(driver, events_with_text[0])
        
        expand_directions_section(driver)
        
        event_data = extract_basic_event_details(driver)
        ticket_data = extract_ticket_data(driver)
        
        print_event_details(event_data, ticket_data)
        
        time.sleep(10)  
        
    finally:
        driver.quit()


if __name__ == "__main__":
    main()