import os
import random
import sys

# Configure UTF-8 encoding for stdout/stderr to support box drawing characters on Windows
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Constants for CLI text decoration
HEADER = '\033[95m'
BLUE = '\033[94m'
CYAN = '\033[96m'
GREEN = '\033[92m'
WARNING = '\033[93m'
FAIL = '\033[91m'
ENDC = '\033[0m'
BOLD = '\033[1m'
UNDERLINE = '\033[4m'

# Check if terminal supports ANSI colors (Windows CMD sometimes needs activation)
if sys.platform == 'win32':
    try:
        import ctypes
        kernel32 = ctypes.windll.kernel32
        kernel32.SetConsoleMode(kernel32.GetStdHandle(-11), 7)
    except Exception:
        # Fallback to empty strings if colors fail or aren't supported
        HEADER = BLUE = CYAN = GREEN = WARNING = FAIL = ENDC = BOLD = UNDERLINE = ""

class Bus:
    def __init__(self, bus_id, name, source, destination, departure_time, fare, total_seats=20):
        self.bus_id = bus_id
        self.name = name
        self.source = source.strip().title()
        self.destination = destination.strip().title()
        self.departure_time = departure_time
        self.fare = fare
        self.total_seats = total_seats
        # seats represent: None if available, passenger name (str) if booked
        self.seats = [None] * total_seats

    def get_available_seats_count(self):
        return self.seats.count(None)

    def is_seat_available(self, seat_num):
        if seat_num < 1 or seat_num > self.total_seats:
            return False
        return self.seats[seat_num - 1] is None

    def book_seat(self, seat_num, passenger_name):
        if self.is_seat_available(seat_num):
            self.seats[seat_num - 1] = passenger_name
            return True
        return False

    def cancel_seat(self, seat_num):
        if 1 <= seat_num <= self.total_seats and self.seats[seat_num - 1] is not None:
            self.seats[seat_num - 1] = None
            return True
        return False

    def render_seat_layout(self):
        print(f"\n{BOLD}Seat Layout for {self.name} ({self.bus_id}){ENDC}")
        print(f"[{GREEN}■{ENDC}] = Available  [{FAIL}☒{ENDC}] = Booked\n")
        
        # We will render in rows of 4 seats: 2 on the left, 2 on the right, aisle in the middle
        # e.g., 01 02   03 04
        for i in range(0, self.total_seats, 4):
            row_seats = []
            for j in range(4):
                if i + j < self.total_seats:
                    seat_idx = i + j
                    seat_num = seat_idx + 1
                    status_char = f"{GREEN}{seat_num:02d}{ENDC}" if self.seats[seat_idx] is None else f"{FAIL}XX{ENDC}"
                    row_seats.append(f"[{status_char}]")
                else:
                    row_seats.append("    ")
            
            # Print row with an aisle space between seat 2 and seat 3
            if len(row_seats) >= 4:
                print(f"  {row_seats[0]} {row_seats[1]}     {row_seats[2]} {row_seats[3]}")
            else:
                # Fallback for non-standard size
                print("  " + " ".join(row_seats))
        print()

class Booking:
    def __init__(self, booking_id, passenger_name, age, gender, bus_id, seat_number, fare):
        self.booking_id = booking_id
        self.passenger_name = passenger_name
        self.age = age
        self.gender = gender.strip().upper()
        self.bus_id = bus_id
        self.seat_number = seat_number
        self.fare = fare


class BusBookingSystem:
    def __init__(self):
        self.buses = {}
        self.bookings = {}
        self.load_mock_data()

    def load_mock_data(self):
        # Initializing sample buses
        mock_buses = [
            Bus("B101", "SilverStar Express", "New York", "Boston", "08:00 AM", 45.00),
            Bus("B102", "SilverStar Express", "Boston", "New York", "02:00 PM", 45.00),
            Bus("B103", "Pacific Transit", "Los Angeles", "San Francisco", "09:30 AM", 60.00),
            Bus("B104", "Pacific Transit", "San Francisco", "Los Angeles", "04:30 PM", 60.00),
            Bus("B105", "Midwest Cruiser", "Chicago", "Detroit", "11:00 AM", 35.00),
            Bus("B106", "Midwest Cruiser", "Detroit", "Chicago", "05:00 PM", 35.00),
            Bus("B107", "Cascadia Link", "Seattle", "Portland", "07:15 AM", 25.00),
            Bus("B108", "Cascadia Link", "Portland", "Seattle", "06:15 PM", 25.00),
        ]
        for bus in mock_buses:
            self.buses[bus.bus_id] = bus

        # Book a few sample seats so the layout shows some booked seats
        self.buses["B101"].book_seat(3, "Alice Smith")
        self.bookings["TX8201"] = Booking("TX8201", "Alice Smith", 28, "F", "B101", 3, 45.00)

        self.buses["B101"].book_seat(7, "Bob Jones")
        self.bookings["TX8202"] = Booking("TX8202", "Bob Jones", 35, "M", "B101", 7, 45.00)

        self.buses["B103"].book_seat(12, "Charlie Brown")
        self.bookings["TX8203"] = Booking("TX8203", "Charlie Brown", 22, "M", "B103", 12, 60.00)

    def print_banner(self):
        print(f"""{BLUE}
╔═══════════════════════════════════════════════════════════════════════╗
║                      🚍   BLUE LINE BUSES   🚍                        ║
║                       Premium Reservation System                      ║
╚═══════════════════════════════════════════════════════════════════════╝{ENDC}""")

    def list_all_buses(self):
        print(f"\n{BOLD}{CYAN}=== List of Available Buses ==={ENDC}")
        self.print_bus_table(self.buses.values())

    def print_bus_table(self, buses_list):
        if not buses_list:
            print(f"{WARNING}No buses found for this criteria.{ENDC}")
            return
        
        # Table Header
        border = "+" + "-"*8 + "+" + "-"*22 + "+" + "-"*15 + "+" + "-"*15 + "+" + "-"*12 + "+" + "-"*8 + "+" + "-"*12 + "+"
        print(border)
        print(f"| {'ID':<6} | {'Bus Name':<20} | {'Source':<13} | {'Destination':<13} | {'Departure':<10} | {'Fare':<6} | {'Avail Seats':<10} |")
        print(border)
        for bus in buses_list:
            avail = bus.get_available_seats_count()
            avail_str = f"{GREEN}{avail}/{bus.total_seats}{ENDC}" if avail > 0 else f"{FAIL}Sold Out{ENDC}"
            fare_str = f"${bus.fare:.2f}"
            print(f"| {bus.bus_id:<6} | {bus.name:<20} | {bus.source:<13} | {bus.destination:<13} | {bus.departure_time:<10} | {fare_str:<6} | {avail_str:<19} |")
        print(border)

    def search_buses(self):
        print(f"\n{BOLD}{CYAN}=== Search Buses ==={ENDC}")
        source = input("Enter Source City: ").strip()
        destination = input("Enter Destination City: ").strip()

        if not source or not destination:
            print(f"{FAIL}Error: Source and Destination cities cannot be empty.{ENDC}")
            return

        results = [
            bus for bus in self.buses.values()
            if bus.source.lower() == source.lower() and bus.destination.lower() == destination.lower()
        ]
        
        print(f"\nSearch Results for {BOLD}{source.title()} ➔ {destination.title()}{ENDC}:")
        self.print_bus_table(results)

    def book_ticket(self):
        print(f"\n{BOLD}{CYAN}=== Reserve a Ticket ==={ENDC}")
        bus_id = input("Enter Bus ID (e.g. B101): ").strip().upper()
        if bus_id not in self.buses:
            print(f"{FAIL}Error: Bus with ID '{bus_id}' does not exist.{ENDC}")
            return

        bus = self.buses[bus_id]
        if bus.get_available_seats_count() == 0:
            print(f"{FAIL}Error: Bus {bus_id} is completely booked.{ENDC}")
            return

        # Show seat layout
        bus.render_seat_layout()

        # Passenger details input
        name = input("Enter Passenger Full Name: ").strip()
        if not name:
            print(f"{FAIL}Error: Passenger name cannot be empty.{ENDC}")
            return

        # Validate Age
        try:
            age = int(input("Enter Passenger Age: "))
            if age <= 0 or age > 120:
                raise ValueError
        except ValueError:
            print(f"{FAIL}Error: Please enter a valid age (1-120).{ENDC}")
            return

        # Validate Gender
        gender = input("Enter Passenger Gender (M/F/Other): ").strip().upper()
        if gender not in ["M", "F", "OTHER"]:
            gender = "OTHER"

        # Select Seat
        try:
            seat_num = int(input(f"Select Seat Number (1-{bus.total_seats}): "))
            if seat_num < 1 or seat_num > bus.total_seats:
                print(f"{FAIL}Error: Seat number must be between 1 and {bus.total_seats}.{ENDC}")
                return
        except ValueError:
            print(f"{FAIL}Error: Please enter a valid numeric seat number.{ENDC}")
            return

        # Check availability and book
        if not bus.is_seat_available(seat_num):
            print(f"{FAIL}Error: Seat {seat_num} is already reserved. Please select an available seat.{ENDC}")
            return

        # Process Booking
        success = bus.book_seat(seat_num, name)
        if success:
            booking_id = f"TX{random.randint(1000, 9999)}"
            while booking_id in self.bookings:
                booking_id = f"TX{random.randint(1000, 9999)}"

            booking = Booking(booking_id, name, age, gender, bus_id, seat_num, bus.fare)
            self.bookings[booking_id] = booking

            print(f"\n{GREEN}✔ Ticket Booked Successfully!{ENDC}")
            self.print_ticket(booking)
        else:
            print(f"{FAIL}Error: Booking failed due to an unexpected seat conflict.{ENDC}")

    def print_ticket(self, booking):
        bus = self.buses[booking.bus_id]
        print(f"""
{CYAN}┌────────────────────────────────────────────────────────┐
│                   BOARDING PASS / TICKET               │
├────────────────────────────────────────────────────────┤
│  Booking ID  : {booking.booking_id:<38}│
│  Passenger   : {booking.passenger_name:<38}│
│  Age/Gender  : {f"{booking.age} yrs / {booking.gender}":<38}│
├────────────────────────────────────────────────────────┤
│  Bus ID      : {bus.bus_id:<38}│
│  Bus Name    : {bus.name:<38}│
│  Route       : {f"{bus.source} to {bus.destination}":<38}│
│  Departure   : {bus.departure_time:<38}│
│  Seat No     : {booking.seat_number:<38}│
│  Fare Paid   : {f"${booking.fare:.2f}":<38}│
└────────────────────────────────────────────────────────┘{ENDC}
""")

    def view_booking_details(self):
        print(f"\n{BOLD}{CYAN}=== Retrieve Reservation ==={ENDC}")
        search_term = input("Enter Booking ID (e.g. TX8201) or Passenger Name: ").strip()
        if not search_term:
            print(f"{FAIL}Error: Search query cannot be empty.{ENDC}")
            return

        found = []
        # Try checking booking ID directly first
        if search_term.upper() in self.bookings:
            found.append(self.bookings[search_term.upper()])
        else:
            # Fallback to checking passenger name (case-insensitive)
            for booking in self.bookings.values():
                if search_term.lower() in booking.passenger_name.lower():
                    found.append(booking)

        if not found:
            print(f"{WARNING}No reservations found matching '{search_term}'.{ENDC}")
            return

        for idx, booking in enumerate(found):
            print(f"\nResult {idx + 1}:")
            self.print_ticket(booking)

    def cancel_booking(self):
        print(f"\n{BOLD}{CYAN}=== Cancel Reservation ==={ENDC}")
        booking_id = input("Enter Booking ID (e.g. TX8201): ").strip().upper()
        if booking_id not in self.bookings:
            print(f"{FAIL}Error: Reservation '{booking_id}' not found.{ENDC}")
            return

        booking = self.bookings[booking_id]
        bus = self.buses[booking.bus_id]

        print(f"\nRetrieve Reservation details to confirm:")
        self.print_ticket(booking)
        confirm = input(f"{WARNING}Are you sure you want to cancel this ticket? (yes/no): {ENDC}").strip().lower()

        if confirm in ["yes", "y"]:
            # Free up the seat
            if bus.cancel_seat(booking.seat_number):
                # Remove booking
                del self.bookings[booking_id]
                print(f"\n{GREEN}✔ Reservation {booking_id} successfully cancelled. Seat {booking.seat_number} is now available.{ENDC}")
            else:
                print(f"{FAIL}Error: Failed to release the seat. Cancellation aborted.{ENDC}")
        else:
            print(f"{CYAN}Cancellation aborted. Ticket remains valid.{ENDC}")

    def run(self):
        while True:
            self.print_banner()
            print("  1. 🚌 View All Buses")
            print("  2. 🔍 Search Buses by Route")
            print("  3. 🎫 Reserve a Ticket")
            print("  4. 📋 View Ticket Details")
            print("  5. ❌ Cancel a Reservation")
            print("  6. 🚪 Exit System")
            print("═" * 72)
            
            choice = input("Select an option (1-6): ").strip()
            
            if choice == "1":
                self.list_all_buses()
            elif choice == "2":
                self.search_buses()
            elif choice == "3":
                self.book_ticket()
            elif choice == "4":
                self.view_booking_details()
            elif choice == "5":
                self.cancel_booking()
            elif choice == "6":
                print(f"\n{GREEN}Thank you for using Blue Line Buses. Have a safe journey! 🚍{ENDC}\n")
                break
            else:
                print(f"\n{FAIL}Invalid option. Please choose a number between 1 and 6.{ENDC}")
            
            input(f"\n{CYAN}Press Enter to return to main menu...{ENDC}")
            # Clear screen (optional but cleaner)
            os.system('cls' if os.name == 'nt' else 'clear')


if __name__ == "__main__":
    try:
        system = BusBookingSystem()
        system.run()
    except KeyboardInterrupt:
        print(f"\n\n{GREEN}System interrupted. Goodbye! 🚍{ENDC}\n")
        sys.exit(0)
