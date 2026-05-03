import json
import os

MODELS = []
BASE_VALUES = {}

def add_model(id_str, brand, name, base_price):
    MODELS.append({
        "id": id_str,
        "brand": brand,
        "name": name
    })
    BASE_VALUES[id_str] = base_price

# --- Apple ---
for i in range(8, 18):
    if i == 9: continue # iPhone 9 never existed
    
    name_num = "X" if i == 10 else str(i)
    id_num = "x" if i == 10 else str(i)

    # Prices decay as i goes down.
    base = 100 * (i - 7)
    if i >= 14:
        add_model(f"iphone-{id_num}-plus", "Apple", f"iPhone {name_num} Plus", base + 100)
    if i in [12, 13]:
        add_model(f"iphone-{id_num}-mini", "Apple", f"iPhone {name_num} mini", base - 50)
    
    add_model(f"iphone-{id_num}", "Apple", f"iPhone {name_num}", base)
    
    if i >= 11:
        add_model(f"iphone-{id_num}-pro", "Apple", f"iPhone {name_num} Pro", base + 200)
        add_model(f"iphone-{id_num}-pro-max", "Apple", f"iPhone {name_num} Pro Max", base + 300)

# Apple SE
add_model("iphone-se-2", "Apple", "iPhone SE (2nd gen)", 150)
add_model("iphone-se-3", "Apple", "iPhone SE (3rd gen)", 250)

# --- Samsung Galaxy S ---
for i in range(10, 25):
    if i > 10 and i < 20: continue # Skipped in real life (S10 -> S20)
    
    base = 80 * (i - 9 if i < 20 else i - 15)
    add_model(f"galaxy-s{i}", "Samsung", f"Galaxy S{i}", base)
    add_model(f"galaxy-s{i}-plus", "Samsung", f"Galaxy S{i}+", base + 150)
    
    if i >= 20:
        add_model(f"galaxy-s{i}-ultra", "Samsung", f"Galaxy S{i} Ultra", base + 300)
        add_model(f"galaxy-s{i}-fe", "Samsung", f"Galaxy S{i} FE", base - 100)

# --- Samsung Galaxy A ---
for i in [1, 2, 3, 5]:
    for j in range(0, 6):
        add_model(f"galaxy-a{i}{j}", "Samsung", f"Galaxy A{i}{j}", 100 + (i*20) + (j*10))

# --- Samsung Foldables ---
for i in range(1, 7):
    add_model(f"galaxy-z-fold-{i}", "Samsung", f"Galaxy Z Fold{i}", 400 + (i * 100))
    add_model(f"galaxy-z-flip-{i}", "Samsung", f"Galaxy Z Flip{i}", 300 + (i * 80))

# --- Xiaomi ---
for i in range(10, 15):
    base = 100 * (i - 9)
    add_model(f"xiaomi-{i}", "Xiaomi", f"Xiaomi {i}", base)
    add_model(f"xiaomi-{i}-pro", "Xiaomi", f"Xiaomi {i} Pro", base + 150)
    add_model(f"xiaomi-{i}-ultra", "Xiaomi", f"Xiaomi {i} Ultra", base + 300)

for i in range(9, 14):
    base = 80 * (i - 8)
    add_model(f"redmi-note-{i}", "Xiaomi", f"Redmi Note {i}", base)
    add_model(f"redmi-note-{i}-pro", "Xiaomi", f"Redmi Note {i} Pro", base + 50)

# --- Huawei ---
for i in [30, 40, 50, 60]:
    base = i * 10
    add_model(f"huawei-p{i}", "Huawei", f"Huawei P{i}", base)
    add_model(f"huawei-p{i}-pro", "Huawei", f"Huawei P{i} Pro", base + 150)
    add_model(f"huawei-mate-{i}", "Huawei", f"Huawei Mate {i}", base + 50)
    add_model(f"huawei-mate-{i}-pro", "Huawei", f"Huawei Mate {i} Pro", base + 200)

# --- Motorola ---
for i in [20, 30, 40, 50]:
    add_model(f"moto-edge-{i}", "Motorola", f"Motorola Edge {i}", i * 10)
    add_model(f"moto-edge-{i}-pro", "Motorola", f"Motorola Edge {i} Pro", i * 15)

add_model("moto-g-power-2023", "Motorola", "Moto G Power (2023)", 150)
add_model("moto-g-stylus-2023", "Motorola", "Moto G Stylus (2023)", 180)
add_model("moto-razr-40", "Motorola", "Motorola Razr 40", 400)
add_model("moto-razr-40-ultra", "Motorola", "Motorola Razr 40 Ultra", 600)

# --- Nokia ---
for i in [10, 20, 21, 42]:
    add_model(f"nokia-g{i}", "Nokia", f"Nokia G{i}", 100 + i)

for i in [10, 20, 30]:
    add_model(f"nokia-x{i}", "Nokia", f"Nokia X{i}", 150 + i)

# --- Other ---
add_model("other-smartphone", "Other", "Other Smartphone", 100)


def generate():
    data = {
        "models": MODELS,
        "base_values": BASE_VALUES
    }
    
    out_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'models_database.json')
    with open(out_path, 'w') as f:
        json.dump(data, f, indent=2)
        
    print(f"Generated {len(MODELS)} models.")
    print(f"Database saved to {out_path}")

if __name__ == '__main__':
    generate()
