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
        print(f"\nEVENT {event_index}:")
        print(f"Title: {meetup_data.get('title')}")
        print(f"Time: {format_iso_datetime_to_readable(meetup_data.get('start_datetime'))} - {format_iso_datetime_to_readable(meetup_data.get('end_datetime'))}")
        print(f"Address: {meetup_data.get('full_address')}")
        print(f"Venue: {meetup_data.get('venue_name')}")
        print(f"Going: {meetup_data.get('going_count')}")
        print(f"Coordinates: {meetup_data.get('latitude')}, {meetup_data.get('longitude')}")
        print(f"URL: {meetup_data.get('event_url')}")
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