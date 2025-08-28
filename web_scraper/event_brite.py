from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time
import re
import json
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
from dotenv import load_dotenv
import os
import random

# Load environment variables from .env file
load_dotenv()

def setup_driver():
    """Initialize and return Chrome WebDriver."""
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
    time.sleep(random.uniform(2, 4))  # Random delay to avoid detection
    
    events = driver.find_elements("xpath", '//a[@class="event-card-link "]')
    events_with_text = [event for event in events if event.text.strip()]
    
    print(f"Found {len(events_with_text)} unique events on this page")
    return events_with_text

def navigate_to_event_page(driver, event):
    """Click on event and switch to new tab if opened."""
    main_window = driver.current_window_handle
    
    driver.execute_script("arguments[0].click();", event)
    time.sleep(2)
    
    # Switch to new tab if opened
    all_windows = driver.window_handles
    if len(all_windows) > 1:
        for window in all_windows:
            if window != main_window:
                driver.switch_to.window(window)
                break
    
    return main_window

def close_event_tab_and_return_to_main(driver, main_window):
    """Close current event tab and return to main listing page."""
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
        print("Could not expand directions section")

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

def setup_database_connection():
    """Establish connection to PostgreSQL database."""
    try:
        conn = psycopg2.connect(
           host=os.getenv('DB_HOST'),
            database=os.getenv('DB_NAME'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD'),
            port=os.getenv('DB_PORT')
        )
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

def insert_or_update_event(event_data, ticket_data, conn):
    """Insert event into database or update if duplicate exists."""
    cursor = conn.cursor()
    
    try:
        insert_data = {
            'event_title': event_data.get('title'),
            'event_start_date': event_data.get('start_date'),
            'event_date_time': event_data.get('date_time'),
            'event_summary': event_data.get('summary'),
            'event_address': event_data.get('address'),
            'event_image_url': event_data.get('image'),
            'directions_url': event_data.get('directions_url'),
            'event_page_url': event_data.get('page_url'),
            'latitude': float(event_data.get('latitude')) if event_data.get('latitude') else None,
            'longitude': float(event_data.get('longitude')) if event_data.get('longitude') else None,
            'total_capacity': ticket_data.get('total_capacity') if ticket_data else None,
            'tickets_sold': ticket_data.get('tickets_sold') if ticket_data else None,
            'tickets_remaining': ticket_data.get('tickets_remaining') if ticket_data else None,
        }
        
        insert_query = """
        INSERT INTO events (
            event_title, event_start_date, event_date_time, event_summary,
            event_address, event_image_url, directions_url, event_page_url,
            latitude, longitude, total_capacity, tickets_sold, tickets_remaining,
            time_added, time_updated
        ) VALUES (
            %(event_title)s, %(event_start_date)s, %(event_date_time)s, %(event_summary)s,
            %(event_address)s, %(event_image_url)s, %(directions_url)s, %(event_page_url)s,
            %(latitude)s, %(longitude)s, %(total_capacity)s, %(tickets_sold)s, %(tickets_remaining)s,
            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
        ON CONFLICT (event_page_url)
        DO UPDATE SET
            event_title = EXCLUDED.event_title,
            event_start_date = EXCLUDED.event_start_date,
            event_date_time = EXCLUDED.event_date_time,
            event_summary = EXCLUDED.event_summary,
            event_address = EXCLUDED.event_address,
            event_image_url = EXCLUDED.event_image_url,
            directions_url = EXCLUDED.directions_url,
            latitude = EXCLUDED.latitude,
            longitude = EXCLUDED.longitude,
            total_capacity = EXCLUDED.total_capacity,
            tickets_sold = EXCLUDED.tickets_sold,
            tickets_remaining = EXCLUDED.tickets_remaining,
            time_updated = CURRENT_TIMESTAMP
        """
        
        cursor.execute(insert_query, insert_data)
        conn.commit()
        
        return True
        
    except Exception as e:
        print(f"Database insertion error for {insert_data.get('event_title', 'Unknown')}: {e}")
        conn.rollback()
        return False
    finally:
        cursor.close()

def save_event_to_database(event_data, ticket_data):
    conn = setup_database_connection()
    if not conn:
        return False
    
    try:
        success = insert_or_update_event(event_data, ticket_data, conn)
        return success
    finally:
        conn.close()

def scrape_single_event(driver, event, main_window):
    """Scrape data from a single event and save to database."""
    try:
        # Navigate to event page
        navigate_to_event_page(driver, event)
        time.sleep(random.uniform(2, 4))
        
        # Expand directions section
        expand_directions_section(driver)
        
        # Extract data
        event_data = extract_basic_event_details(driver)
        ticket_data = extract_ticket_data(driver)
        
        # Save to database
        success = save_event_to_database(event_data, ticket_data)
        
        if success:
            print(f"✓ Scraped and saved: {event_data.get('title', 'Unknown Event')}")
        else:
            print(f"✗ Failed to save: {event_data.get('title', 'Unknown Event')}")
        
        return success
        
    except Exception as e:
        print(f"Error scraping event: {e}")
        return False
    finally:
        # Always return to main page
        close_event_tab_and_return_to_main(driver, main_window)
        time.sleep(random.uniform(1, 2))

def scrape_all_pages(driver, base_url, max_pages=5):
    """Scrape events from multiple pages."""
    total_scraped = 0
    total_saved = 0
    
    for page_num in range(1, max_pages + 1):
        print(f"\n{'='*60}")
        print(f"SCRAPING PAGE {page_num}")
        print(f"{'='*60}")
        
        # Build URL for current page
        website = f"{base_url}?page={page_num}"
        print(f"Loading: {website}")
        
        # Get events from current page
        events_with_text = get_events_from_listing_page(driver, website)
        
        if not events_with_text:
            print(f"No events found on page {page_num}. Stopping.")
            break
        
        main_window = driver.current_window_handle
        
        # Scrape each event on this page
        for i, event in enumerate(events_with_text, 1):
            print(f"\nScraping event {i}/{len(events_with_text)} on page {page_num}")
            
            success = scrape_single_event(driver, event, main_window)
            total_scraped += 1
            
            if success:
                total_saved += 1
            
            # Rate limiting between events
            time.sleep(random.uniform(2, 4))
        
        print(f"\nPage {page_num} completed: {len(events_with_text)} events processed")
        
        # Rate limiting between pages
        time.sleep(random.uniform(3, 6))
    
    print(f"\n{'='*60}")
    print(f"SCRAPING COMPLETED")
    print(f"Total events scraped: {total_scraped}")
    print(f"Total events saved to database: {total_saved}")
    print(f"{'='*60}")

def main():
    base_url = 'https://www.eventbrite.com/d/ny--new-york--manhattan/events--today/'
    max_pages = 3  # Adjust this number as needed
    
    driver = setup_driver()
    
    try:
        scrape_all_pages(driver, base_url, max_pages)
        
    except KeyboardInterrupt:
        print("\nScraping interrupted by user")
    except Exception as e:
        print(f"Unexpected error: {e}")
    finally:
        driver.quit()
        print("Browser closed")

if __name__ == "__main__":
    main()