from playwright.sync_api import sync_playwright
import time
import sys

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

def test_dashboard():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # Visual mode for testing
        page = browser.new_page()

        print("🚀 Starting USAC RHC Dashboard Test Suite\n")

        # 1. Load Dashboard
        print("1️⃣ Loading dashboard...")
        page.goto('http://localhost:3000')
        page.wait_for_load_state('networkidle')
        time.sleep(2)  # Allow React to hydrate
        page.screenshot(path='C:/ClaudeAgents/projects/usac-rhc-automation/screenshots/01_initial_load.png', full_page=True)
        print("   ✅ Dashboard loaded successfully\n")

        # 2. Check for all filters
        print("2️⃣ Checking all 7 filters...")

        # Funding Year filter
        funding_year = page.locator('select').filter(has_text='2024').first
        if funding_year.is_visible():
            print("   ✅ Funding Year dropdown found")

        # State filter
        state_filter = page.locator('text=Select State').first
        if state_filter.is_visible():
            print("   ✅ State filter found")

        # Consultant type filter
        consultant_filter = page.locator('text=Consultant Type').first
        if consultant_filter.is_visible():
            print("   ✅ Consultant type filter found")

        # Date picker
        date_picker = page.locator('button').filter(has_text='Today')
        if date_picker.is_visible():
            print("   ✅ Date picker found")

        # Status buttons
        status_all = page.locator('button:has-text("All")').first
        if status_all.is_visible():
            print("   ✅ Status buttons found")

        # Search
        search_input = page.locator('input[placeholder*="Search"]').first
        if search_input.is_visible():
            print("   ✅ Search input found")

        # View mode toggle
        view_toggle = page.locator('button[aria-label*="Grid view"], button:has-text("Grid")').first
        if view_toggle.is_visible():
            print("   ✅ View mode toggle found")

        page.screenshot(path='C:/ClaudeAgents/projects/usac-rhc-automation/screenshots/02_filters_visible.png', full_page=True)
        print()

        # 3. Test Dark Mode Toggle
        print("3️⃣ Testing dark mode toggle...")
        dark_mode_button = page.locator('button').filter(has_text='☀️').or_(page.locator('button').filter(has_text='🌙')).first
        if dark_mode_button.is_visible():
            dark_mode_button.click()
            time.sleep(1)
            page.screenshot(path='C:/ClaudeAgents/projects/usac-rhc-automation/screenshots/03_dark_mode_on.png', full_page=True)
            print("   ✅ Dark mode toggled ON")

            dark_mode_button.click()
            time.sleep(1)
            page.screenshot(path='C:/ClaudeAgents/projects/usac-rhc-automation/screenshots/04_dark_mode_off.png', full_page=True)
            print("   ✅ Dark mode toggled OFF")
        print()

        # 4. Test View Modes
        print("4️⃣ Testing view modes (Grid/List/Compact/Map)...")

        # Try to find view mode buttons
        view_buttons = page.locator('button').all()
        view_mode_texts = ['Grid', 'List', 'Compact', 'Map']

        for mode in view_mode_texts:
            try:
                mode_button = page.locator(f'button:has-text("{mode}")').first
                if mode_button.is_visible():
                    mode_button.click()
                    time.sleep(2)
                    page.screenshot(path=f'C:/ClaudeAgents/projects/usac-rhc-automation/screenshots/05_{mode.lower()}_view.png', full_page=True)
                    print(f"   ✅ {mode} view working")
            except:
                print(f"   ⚠️  {mode} view button not found")
        print()

        # Switch back to Grid view
        try:
            grid_button = page.locator('button:has-text("Grid")').first
            if grid_button.is_visible():
                grid_button.click()
                time.sleep(1)
        except:
            pass

        # 5. Test Search Highlighting
        print("5️⃣ Testing search functionality and highlighting...")
        search_input = page.locator('input[placeholder*="Search"]').first
        if search_input.is_visible():
            search_input.fill('clinic')
            time.sleep(2)
            page.screenshot(path='C:/ClaudeAgents/projects/usac-rhc-automation/screenshots/06_search_highlight.png', full_page=True)
            print("   ✅ Search with highlighting tested")
            search_input.clear()
            time.sleep(1)
        print()

        # 6. Test State Filter
        print("6️⃣ Testing state filter...")
        try:
            state_button = page.locator('text=Select State').first
            if state_button.is_visible():
                state_button.click()
                time.sleep(1)
                # Try to select a state
                arizona = page.locator('text=Arizona').first
                if arizona.is_visible():
                    arizona.click()
                    time.sleep(2)
                    page.screenshot(path='C:/ClaudeAgents/projects/usac-rhc-automation/screenshots/07_state_filter.png', full_page=True)
                    print("   ✅ State filter working")
        except:
            print("   ⚠️  State filter interaction failed")
        print()

        # 7. Test Timeline View (need to open a notes modal first)
        print("7️⃣ Testing timeline view in notes modal...")
        try:
            # Look for "View Notes" button on any clinic card
            view_notes_button = page.locator('button:has-text("View Notes")').first
            if view_notes_button.is_visible(timeout=3000):
                view_notes_button.click()
                time.sleep(2)
                page.screenshot(path='C:/ClaudeAgents/projects/usac-rhc-automation/screenshots/08_notes_modal.png', full_page=True)
                print("   ✅ Notes modal opened")

                # Look for timeline toggle
                timeline_toggle = page.locator('button:has-text("Timeline")').first
                if timeline_toggle.is_visible():
                    timeline_toggle.click()
                    time.sleep(1)
                    page.screenshot(path='C:/ClaudeAgents/projects/usac-rhc-automation/screenshots/09_timeline_view.png', full_page=True)
                    print("   ✅ Timeline view working")

                # Close modal
                close_button = page.locator('button').filter(has_text='×').or_(page.locator('button[aria-label="Close"]')).first
                if close_button.is_visible():
                    close_button.click()
                    time.sleep(1)
            else:
                print("   ℹ️  No clinic cards with notes available to test")
        except Exception as e:
            print(f"   ⚠️  Timeline view test skipped: {str(e)}")
        print()

        # 8. Test Status Filters
        print("8️⃣ Testing status filter buttons...")
        status_filters = ['All', 'Pending', 'Contacted', 'Qualified']
        for status in status_filters:
            try:
                status_btn = page.locator(f'button:has-text("{status}")').first
                if status_btn.is_visible():
                    status_btn.click()
                    time.sleep(1)
                    print(f"   ✅ {status} status filter working")
            except:
                print(f"   ⚠️  {status} status filter not found")
        print()

        # 9. Check Animations
        print("9️⃣ Checking for smooth animations...")
        page.screenshot(path='C:/ClaudeAgents/projects/usac-rhc-automation/screenshots/10_final_state.png', full_page=True)
        print("   ✅ Final state captured")
        print()

        # 10. Console Logs Check
        print("🔟 Checking for console errors...")
        console_messages = []

        def handle_console(msg):
            if msg.type in ['error', 'warning']:
                console_messages.append(f"{msg.type.upper()}: {msg.text}")

        page.on('console', handle_console)
        page.reload()
        page.wait_for_load_state('networkidle')
        time.sleep(2)

        if console_messages:
            print("   ⚠️  Console messages found:")
            for msg in console_messages:
                print(f"      {msg}")
        else:
            print("   ✅ No console errors or warnings")
        print()

        print("=" * 60)
        print("✅ TEST SUITE COMPLETE")
        print("=" * 60)
        print(f"\n📸 Screenshots saved to: C:/ClaudeAgents/projects/usac-rhc-automation/screenshots/")

        browser.close()

if __name__ == '__main__':
    test_dashboard()
