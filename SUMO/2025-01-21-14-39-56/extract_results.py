import xml.etree.ElementTree as ET

tree = ET.parse('fcd_output.xml')
root = tree.getroot()

vehicle_data = []

for timestep in root.findall('timestep'):
    time = float(timestep.get('time'))
    for vehicle in timestep.findall('vehicle'):
        vehicle_id = vehicle.get('id')
        speed = float(vehicle.get('speed'))
        accel = float(vehicle.get('acceleration', 0))
        loc = (float(vehicle.get('x')), float(vehicle.get('y')))
        vehicle_data.append({'time': time, 'id': vehicle_id, 'speed': speed, 'acceleration': accel, 'location': loc})

print(f"Total records extracted: {len(vehicle_data)}")

# print("First 20 records:")
# for entry in vehicle_data[:20]:
#     print(entry)

# print("Last 20 records:")
# for entry in vehicle_data[-20:]:
#     print(entry)

veh1_data = [entry for entry in vehicle_data if entry['id'] == 'veh1']
print(f"Number of records for vehicle 1: {len(veh1_data)}")
for entry in veh1_data:
    print(entry)