from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
import time
import json
import arrow
import random
import platform
import psycopg2
from dotenv import load_dotenv
import os

load_dotenv()

def setup_database_connection():
    conn = psycopg2.connect(
        host=os.getenv('DB_HOST'),
        database=os.getenv('DB_NAME'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        port=os.getenv('DB_PORT')
    )
    return conn

def save_meetup_event_to_database(meetup_data):
    conn = setup_database_connection()
    if not conn:
        return False
    
    cursor = conn.cursor()
    
    try:
        # Format the date_time as readable string with start and end times
        date_time_formatted = None
        if meetup_data.get('start_datetime') and meetup_data.get('end_datetime'):
            try:
                start_dt = arrow.get(meetup_data['start_datetime'])
                end_dt = arrow.get(meetup_data['end_datetime'])
                start_readable = start_dt.format('dddd, MMMM D, YYYY [at] h:mm A')
                end_readable = end_dt.format('h:mm A')
                date_time_formatted = f"{start_readable} - {end_readable}"
            except:
                pass
        elif meetup_data.get('start_datetime'):
            try:
                start_dt = arrow.get(meetup_data['start_datetime'])
                date_time_formatted = start_dt.format('dddd, MMMM D, YYYY [at] h:mm A')
            except:
                pass
        
        insert_data = {
            'event_title': meetup_data.get('title'),
            'event_start_date': None,
            'event_date_time': date_time_formatted,
            'event_summary': meetup_data.get('description'),
            'event_address': meetup_data.get('full_address') or meetup_data.get('venue_address'),
            'event_image_url': meetup_data.get('image_url'),
            'directions_url': None,
            'event_page_url': meetup_data.get('event_url'),
            'latitude': float(meetup_data.get('latitude')) if meetup_data.get('latitude') else None,
            'longitude': float(meetup_data.get('longitude')) if meetup_data.get('longitude') else None,
            'total_capacity': None,
            'tickets_sold': meetup_data.get('going_count'),
            'tickets_remaining': None,
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
        print(f"Database error for {meetup_data.get('title', 'Unknown')}: {e}")
        conn.rollback()
        return False
    finally:
        cursor.close()
        conn.close()

def extract_meetup_json_data(driver):
    script_element = driver.find_element("xpath", '//script[@id="__NEXT_DATA__"]')
    json_content = script_element.get_attribute('innerHTML')
    data = json.loads(json_content)
    event_data = data.get('props', {}).get('pageProps', {}).get('event', {})
    
    if not event_data:
        return None
        
    extracted_data = {
        'title': event_data.get('title'),
        'description': event_data.get('description'),
        'event_url': event_data.get('eventUrl'),
        'start_datetime': event_data.get('dateTime'),
        'end_datetime': event_data.get('endTime'),
        'timezone': event_data.get('timezone'),
        'going_count': event_data.get('goingCount', {}).get('totalCount', 0),
    }
    
    venue = event_data.get('venue', {})
    if venue:
        extracted_data.update({
            'venue_name': venue.get('name'),
            'venue_address': venue.get('address'),
            'venue_city': venue.get('city'),
            'venue_state': venue.get('state'),
            'latitude': venue.get('lat'),
            'longitude': venue.get('lng'),
        })
    
    photo = event_data.get('featuredEventPhoto', {})
    if photo:
        extracted_data['image_url'] = photo.get('source')
    
    if extracted_data.get('venue_address') and extracted_data.get('venue_city'):
        full_address = f"{extracted_data['venue_address']}, {extracted_data['venue_city']}"
        if extracted_data.get('venue_state'):
            full_address += f", {extracted_data['venue_state']}"
        extracted_data['full_address'] = full_address
    
    return extracted_data

def format_iso_datetime_to_readable(iso_datetime):
    if not iso_datetime:
        return None
    dt = arrow.get(iso_datetime)
    return dt.format('dddd, MMMM D, YYYY [at] h:mm A')

def scroll_and_load_all_events(driver, max_scrolls=5):
    last_height = driver.execute_script("return document.body.scrollHeight")
    scrolls = 0
    
    while scrolls < max_scrolls:
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(random.uniform(2, 4))
        
        event_elements = driver.find_elements("xpath", '//div[@class="absolute inset-0"]')
        print(f"Found {len(event_elements)} event elements after scroll {scrolls + 1}")
        
        new_height = driver.execute_script("return document.body.scrollHeight")
        if new_height == last_height and scrolls > 2:
            break
            
        last_height = new_height
        scrolls += 1
    
    final_events = driver.find_elements("xpath", '//div[@class="absolute inset-0"]')
    if len(final_events) == 0:
        final_events = driver.find_elements("xpath", '//a[contains(@href, "/events/")]')
    
    return final_events

def open_event_in_new_tab(driver, event_element):
    main_window = driver.current_window_handle
    
    modifier_key = Keys.COMMAND if platform.system() == "Darwin" else Keys.CONTROL
    ActionChains(driver).key_down(modifier_key).click(event_element).key_up(modifier_key).perform()
    time.sleep(2)
    
    all_windows = driver.window_handles
    if len(all_windows) > 1:
        for window in all_windows:
            if window != main_window:
                driver.switch_to.window(window)
                break
    
    return main_window

def close_tab_and_return_to_main(driver, main_window):
    current_window = driver.current_window_handle
    if current_window != main_window:
        driver.close()
        driver.switch_to.window(main_window)
        time.sleep(1)

def scrape_single_event(driver, event_element, event_index, main_window):
    open_event_in_new_tab(driver, event_element)
    time.sleep(random.uniform(2, 4))
    
    meetup_data = extract_meetup_json_data(driver)
    
    if meetup_data:
        # Save to database
        db_success = save_meetup_event_to_database(meetup_data)
        
        print(f"\nEVENT {event_index}:")
        print(f"Title: {meetup_data.get('title')}")
        print(f"Time: {format_iso_datetime_to_readable(meetup_data.get('start_datetime'))} - {format_iso_datetime_to_readable(meetup_data.get('end_datetime'))}")
        print(f"Address: {meetup_data.get('full_address')}")
        print(f"Venue: {meetup_data.get('venue_name')}")
        print(f"Going: {meetup_data.get('going_count')}")
        print(f"Coordinates: {meetup_data.get('latitude')}, {meetup_data.get('longitude')}")
        print(f"URL: {meetup_data.get('event_url')}")
        
        if db_success:
            print(f"✓ Saved to database")
        else:
            print(f"✗ Database save failed")
            
        success = True
    else:
        print(f"Event {event_index}: No data extracted")
        success = False
    
    close_tab_and_return_to_main(driver, main_window)
    time.sleep(random.uniform(1, 2))
    
    return success

def main():
    website = 'https://www.meetup.com/find/?location=us--ny--Manhattan&source=EVENTS&dateRange=today&eventType=inPerson'
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service)
    
    driver.get(website)
    time.sleep(3)
    
    event_elements = scroll_and_load_all_events(driver, max_scrolls=5)
    
    if not event_elements:
        print("No events found")
        return
    
    main_window = driver.current_window_handle
    print(f"\nScraping {len(event_elements)} events")
    
    successful_scrapes = 0
    
    for i, event_element in enumerate(event_elements, 1):
        success = scrape_single_event(driver, event_element, i, main_window)
        if success:
            successful_scrapes += 1
        time.sleep(random.uniform(2, 4))
    
    print(f"\nCompleted: {successful_scrapes}/{len(event_elements)} events scraped successfully")
    
    time.sleep(5)
    driver.quit()

if __name__ == "__main__":
    main()