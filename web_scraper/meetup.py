from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time
import re
import json
import arrow

def extract_meetup_json_data(driver):
    try:
        script_element = driver.find_element("xpath", '//script[@id="__NEXT_DATA__"]')
        json_content = script_element.get_attribute('innerHTML')
        
        data = json.loads(json_content)
        
        event_data = data.get('props', {}).get('pageProps', {}).get('event', {})
        
        if not event_data:
            print("No event data found in JSON")
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
        
        # Format full address
        if extracted_data.get('venue_address') and extracted_data.get('venue_city'):
            full_address = f"{extracted_data['venue_address']}, {extracted_data['venue_city']}"
            if extracted_data.get('venue_state'):
                full_address += f", {extracted_data['venue_state']}"
            extracted_data['full_address'] = full_address
        
        return extracted_data
        
    except Exception as e:
        print(f"Error extracting JSON data: {e}")
        return None
    

def format_iso_datetime_to_readable(iso_datetime):
    if not iso_datetime:
        return None
    
    try:
        dt = arrow.get(iso_datetime)
        return dt.format('dddd, MMMM D, YYYY [at] h:mm A')
    except:
        return iso_datetime  

website = 'https://www.meetup.com/find/?location=us--ny--Manhattan&source=EVENTS&dateRange=today&eventType=inPerson'

service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service)
driver.get(website)

time.sleep(3)

events = driver.find_elements("xpath", '//div[@class="absolute inset-0"]')
event_info_from_homepage = driver.find_elements("xpath", '//div[@class="flex w-full justify-center"]')

print(f"Found {len(event_info_from_homepage)} unique events:")
for i, event in enumerate(event_info_from_homepage):
    print(f"Event {i+1}:")   
    print(event.text)
    print("-----")

# Handle new tab opening
original_window = driver.current_window_handle

# Click on the first event 
driver.execute_script("arguments[0].click();", events[0])

time.sleep(3)

# Switch to new tab if opened
all_windows = driver.window_handles
if len(all_windows) > 1:
    for window in all_windows:
        if window != original_window:
            driver.switch_to.window(window)
            break

meetup_data = extract_meetup_json_data(driver)

current_event_url = driver.current_url

if meetup_data:
    print("\n" + "="*60)
    print("EVENT DATA FROM JSON:")
    print("="*60)
    print(f"Event Title: {meetup_data.get('title')}")
    print(f"Event Time: {format_iso_datetime_to_readable(meetup_data.get('start_datetime'))} - {format_iso_datetime_to_readable(meetup_data.get('end_datetime'))}")
    print(f"Event Summary: {meetup_data.get('description')}") 
    print(f"Event Address: {meetup_data.get('full_address')}")
    print(f"Event Image URL: {meetup_data.get('image_url')}")
    print(f"Event URL: {meetup_data.get('event_url')}")
    print(f"Venue Name: {meetup_data.get('venue_name')}")
    print(f"Going Count: {meetup_data.get('going_count')}")
    print(f"Latitude: {meetup_data.get('latitude')}")
    print(f"Longitude: {meetup_data.get('longitude')}")
    print(f"Timezone: {meetup_data.get('timezone')}")
    print(f"Current Event URL: {current_event_url}")

else:
    print("Failed to extract event data from JSON.")


time.sleep(200)
driver.quit()