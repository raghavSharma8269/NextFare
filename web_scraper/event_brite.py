from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time

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


driver.execute_script("arguments[0].click();", events_with_text[0])

time.sleep(10)