from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time
import re
import json

def extract_coordinates_from_google_url(google_url):
    # searches for patterns like daddr=40.712776,-74.005974 from url
    coords = re.search(r'daddr=([0-9.-]+),([0-9.-]+)', google_url)
    if coords:
        return coords.groups()  # Returns (latitude, longitude)
    return None, None


website = 'https://www.eventbrite.com/d/ny--new-york--manhattan/events--today/?page=1'

service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service)
driver.get(website)

time.sleep(1)

events = driver.find_elements("xpath", '//a[@class="event-card-link "]')

# Filter to only events with text 
events_with_text = [event for event in events if event.text.strip()]

print(f"Found {len(events_with_text)} unique events:")
for i, event in enumerate(events_with_text):
    print(f"Event {i+1}:")
    print(f"  Text: {event.text}")
    print(f"  Href: {event.get_attribute('href')}")
    print()

# Handle new tab opening
original_window = driver.current_window_handle

# Click on the first event 
driver.execute_script("arguments[0].click();", events_with_text[0])

time.sleep(2)

# Switch to new tab if opened
all_windows = driver.window_handles
if len(all_windows) > 1:
    for window in all_windows:
        if window != original_window:
            driver.switch_to.window(window)
            break

# Expand the "Get Directions" section
expand_get_directions = driver.find_element("xpath", '//button[@class="eds-btn eds-btn--link"]')
driver.execute_script("arguments[0].click();", expand_get_directions)

# Extract event details 
try:
    event_title = driver.find_element("xpath", '//h1[@class="event-title css-0"]').text
except:
    event_title = "title not found"

try:
    event_start_date = driver.find_element("xpath", '//time[@class="start-date"]').text
except:
    event_start_date = "start date not found"

try:
    event_date_time = driver.find_element("xpath", '//span[@class="date-info__full-datetime"]').text
except:
    event_date_time = "date time not found"

try:
    event_summary = driver.find_element("xpath", '//p[@class="summary"]').text
except:
    event_summary = "summary not found"

try:
    event_address = driver.find_element("xpath", '//div[@class="location-info__address"]').text
except:
    event_address = "address not found"

try:
    event_image = driver.find_element("xpath", '//img[@class="css-1mghjxa eyu62kx0"]').get_attribute('src')
    
except:
    event_image = "img not found"

try:
    directions_url = driver.find_element("xpath", '//a[@aria-label="Driving directions"]').get_attribute('href')
    lat, lng = extract_coordinates_from_google_url(directions_url)
except:
    directions_url = "url not found"
    lat, lng = None, None

try:
    current_event_url = driver.current_url
except:
    current_event_url = "current url not found"
    

print(f"Event Title: {event_title}")
print(f"Event Start Date: {event_start_date}")
print(f"Event Date and Time: {event_date_time}")
print(f"Event Summary: {event_summary}")
print(f"Event Address: {event_address}")
print(f"Event Image URL: {event_image}")
print(f"Directions URL: {directions_url}")
print(f"Latitude: {lat}, Longitude: {lng}")
print(f"Event Page URL: {current_event_url}")

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
        
        print(f"Total Capacity: {total_capacity}")
        print(f"Tickets Sold: {tickets_sold}")
        print(f"Tickets Remaining: {total_capacity - tickets_sold}")
        print(f"Ticket Statuses: {ticket_status}")
        
except:
    print("Could not extract ticket data")

time.sleep(200)
driver.quit()