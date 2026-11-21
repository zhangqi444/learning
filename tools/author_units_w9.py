#!/usr/bin/env python3
"""Author the W9 unit-conversion layer: content/question-banks/ma-units-plus.json.

Why this exists (21 November 2026): on a practice paper that day Sheila missed
"Fred weighs 65,000 grams. Margaret weighs 45 kilograms. How many kilograms do they
weigh combined?", and told her parent she did not know how grams and kilograms convert.
The real ISEE report for 24 October had Measurement at 3 of 4, and W9 held one
conversion question (yards to feet). Lower Level asks both systems, so this layer gives
W9 two more MA sittings: metric mass, length and capacity (kilo = 1,000, centi = 1/100,
milli = 1/1,000), customary length, weight and capacity, time, and conversions inside a
two-step story, which is where the original miss came from.

The rules are those of tools/author_w9.py, whose make() this imports: official choice
order, every key asserted against a computation, and a `why` for each wrong choice.
"""
import json, os, sys
from fractions import Fraction as F
sys.path.insert(0, os.path.dirname(__file__))
import author_w9
from author_w9 import make
author_w9.VER = '2026.11.21'     # make() stamps items with author_w9's VER

U = []
def u(n, sub, diff, prompt, key, wrong, expl, misc, value=None):
    U.append(make(f'MA-W9-U-{n:02d}', 'MA', 'Measurement', sub, diff, prompt, key, wrong, expl, misc, value=value))

# ---------------------------------------------------------------- metric mass
assert 65000 // 1000 == 65
u(1, 'grams to kilograms', 'E', 'How many kilograms are in 65,000 grams?',
  '65 kg', {'6.5 kg': '6.5 kg divides by 10,000. A kilogram is 1,000 grams, so divide by 1,000.',
            '650 kg': '650 kg takes away only two zeros. 1,000 grams make 1 kilogram, so divide by 1,000.',
            '6,500 kg': '6,500 kg takes away only one zero. 1 kg = 1,000 g, so divide by 1,000.'},
  'Kilo means 1,000, so 1 kg = 1,000 g. Going from grams (small) to kilograms (big), the number gets smaller: 65,000 ÷ 1,000 = 65 kg.',
  'divides by the wrong power of ten', 65)

assert 3 * 1000 == 3000
u(2, 'kilograms to grams', 'E', 'How many grams are in 3 kilograms?',
  '3,000 g', {'3 g': '3 g keeps the same number. A kilogram is much heavier than a gram, so there are many more grams.',
              '30 g': '30 g multiplies by 10. 1 kg = 1,000 g.',
              '300 g': '300 g multiplies by 100. 1 kg = 1,000 g.'},
  '1 kg = 1,000 g. Going from a big unit to a small one, the number gets bigger: 3 × 1,000 = 3,000 g.',
  'multiplies by the wrong power of ten', 3000)

assert 2 * 1000 + 400 == 2400
u(3, 'mixed kilograms and grams', 'M', 'How many grams are in 2 kilograms 400 grams?',
  '2,400 g', {'240 g': '240 g treats 2 kg as 200 g. 2 kg is 2,000 g.',
              '2,040 g': '2,040 g adds 40 instead of 400: 2,000 + 400 = 2,400.',
              '24,000 g': '24,000 g writes 2 and 400 side by side and adds a zero.'},
  '2 kg = 2,000 g. Add the 400 g: 2,000 + 400 = 2,400 g.',
  'writes the numbers side by side', 2400)

assert F(4500, 1000) + 3 == F(15, 2)
u(4, 'adding a mass in grams to one in kilograms', 'M',
  'One box weighs 4,500 grams. Another box weighs 3 kilograms. How many kilograms do the two boxes weigh together?',
  '7.5 kg', {'4.8 kg': '4.8 kg treats 3 kilograms as 300 grams. Change 4,500 g to kilograms instead: 4.5 kg.',
             '48 kg': '48 kg adds 45 and 3. 4,500 grams is 4.5 kilograms, not 45.',
             '4,503 kg': '4,503 kg adds 3 to 4,500 without changing the grams into kilograms. Put both in the same unit first.'},
  'Put both in kilograms: 4,500 g ÷ 1,000 = 4.5 kg. Then 4.5 + 3 = 7.5 kg.',
  'adds numbers in different units', F(15, 2))

# ---------------------------------------------------------------- metric length
assert 5 * 1000 == 5000
u(5, 'kilometers to meters', 'E', 'How many meters are in 5 kilometers?',
  '5,000 m', {'5 m': '5 m keeps the same number. A kilometer is much longer than a meter.',
              '50 m': '50 m multiplies by 10. 1 km = 1,000 m.',
              '500 m': '500 m multiplies by 100. 1 km = 1,000 m.'},
  'Kilo means 1,000: 1 km = 1,000 m. 5 × 1,000 = 5,000 m.',
  'multiplies by the wrong power of ten', 5000)

assert F(2500, 1000) == F(5, 2)
u(6, 'meters to kilometers', 'M', 'How many kilometers are in 2,500 meters?',
  '2.5 km', {'25 km': '25 km divides by 100. 1 km = 1,000 m, so divide by 1,000.',
             '250 km': '250 km divides by 10. 1 km = 1,000 m, so divide by 1,000.',
             '2,500,000 km': '2,500,000 km multiplies by 1,000. Meters are smaller than kilometers, so the number should get smaller.'},
  'Going from meters (small) to kilometers (big), divide by 1,000: 2,500 ÷ 1,000 = 2.5 km.',
  'multiplies when it should divide', F(5, 2))

assert 3 * 100 == 300
u(7, 'meters to centimeters', 'E', 'How many centimeters are in 3 meters?',
  '300 cm', {'0.03 cm': '0.03 cm divides by 100. A meter is bigger than a centimeter, so multiply.',
             '30 cm': '30 cm multiplies by 10. 1 m = 100 cm.',
             '3,000 cm': '3,000 cm multiplies by 1,000. That would be millimeters: 1 m = 100 cm.'},
  'Centi means one hundredth, so 1 m = 100 cm. 3 × 100 = 300 cm.',
  'uses 1,000 instead of 100', 300)

assert 100 + 35 == 135
u(8, 'meters and centimeters to centimeters', 'M', 'How many centimeters are in 1 meter 35 centimeters?',
  '135 cm', {'36 cm': '36 cm adds 1 and 35. The 1 is a whole meter, which is 100 cm.',
             '1,035 cm': '1,035 cm treats 1 m as 1,000 cm. 1 m = 100 cm.',
             '1,350 cm': '1,350 cm writes 1 and 35 side by side and adds a zero.'},
  '1 m = 100 cm. Add the 35 cm: 100 + 35 = 135 cm.',
  'adds the numbers without converting', 135)

assert F(45, 10) == F(9, 2)
u(9, 'millimeters to centimeters', 'M', 'How many centimeters are in 45 millimeters?',
  '4.5 cm', {'45 cm': '45 cm keeps the same number. A centimeter is 10 millimeters.',
             '450 cm': '450 cm multiplies by 10. Millimeters are smaller, so divide.',
             '4,500 cm': '4,500 cm multiplies by 100.'},
  '1 cm = 10 mm. Going from millimeters (small) to centimeters (big), divide: 45 ÷ 10 = 4.5 cm.',
  'multiplies when it should divide', F(9, 2))

# ---------------------------------------------------------------- metric capacity
assert 4000 // 1000 == 4
u(10, 'milliliters to liters', 'E', 'How many liters are in 4,000 milliliters?',
  '4 L', {'40 L': '40 L divides by 100. 1 L = 1,000 mL.',
          '400 L': '400 L divides by 10.',
          '4,000,000 L': '4,000,000 L multiplies by 1,000. Milliliters are tiny, so the number of liters is smaller.'},
  'Milli means one thousandth, so 1 L = 1,000 mL. 4,000 ÷ 1,000 = 4 L.',
  'multiplies when it should divide', 4)

assert 1500 + 2 * 1000 == 3500
u(11, 'adding milliliters and liters', 'M',
  'A jug holds 1,500 milliliters of juice. Ana adds 2 liters of water. How many milliliters are in the jug now?',
  '3,500 mL', {'1,502 mL': '1,502 mL adds 2 to 1,500 without changing liters to milliliters.',
               '1,700 mL': '1,700 mL treats 2 L as 200 mL. 1 L = 1,000 mL, so 2 L = 2,000 mL.',
               '21,500 mL': '21,500 mL treats 2 L as 20,000 mL.'},
  'Put both in milliliters: 2 L = 2,000 mL. Then 1,500 + 2,000 = 3,500 mL.',
  'adds numbers in different units', 3500)

assert 3 * 100 // 25 == 12
u(12, 'how many pieces fit, in mixed units', 'H',
  'A ribbon 3 meters long is cut into pieces that are each 25 centimeters long. How many pieces are there?',
  '12', {'4': '4 is the number of pieces in one meter. The ribbon is 3 meters long.',
         '75': '75 multiplies 3 by 25. Fitting pieces into a length is division.',
         '120': '120 uses 3,000 cm for 3 meters. 1 m = 100 cm, so 3 m = 300 cm.'},
  'Change meters to centimeters: 3 m = 300 cm. Then 300 ÷ 25 = 12 pieces.',
  'divides without converting; uses the wrong conversion', 12)

# ---------------------------------------------------------------- customary length
assert 4 * 12 == 48
u(13, 'feet to inches', 'E', 'How many inches are in 4 feet?',
  '48 in', {'12 in': '12 in is one foot. There are 4 feet.',
            '16 in': '16 in adds 4 and 12. Each of the 4 feet is 12 inches, so multiply.',
            '40 in': '40 in uses 10 inches in a foot. A foot is 12 inches.'},
  '1 ft = 12 in. 4 × 12 = 48 in.',
  'adds instead of multiplying; uses 10', 48)

assert 5 * 3 == 15
u(14, 'yards to feet', 'E', 'How many feet are in 5 yards?',
  '15 ft', {'8 ft': '8 ft adds 5 and 3. Each yard is 3 feet, so multiply.',
            '60 ft': '60 ft uses 12 feet in a yard. 12 is inches in a foot; a yard is 3 feet.',
            '180 ft': '180 ft is the number of inches in 5 yards, not feet.'},
  '1 yd = 3 ft. 5 × 3 = 15 ft.',
  'adds instead of multiplying; mixes up the units', 15)

assert 36 // 12 == 3
u(15, 'inches to feet', 'E', 'How many feet are in 36 inches?',
  '3 ft', {'12 ft': '12 ft is the number of inches in one foot.',
           '48 ft': '48 ft adds 36 and 12. Inches are smaller than feet, so divide: 36 ÷ 12.',
           '432 ft': '432 ft multiplies 36 by 12. Going to a bigger unit, divide.'},
  '1 ft = 12 in. Going from inches (small) to feet (big), divide: 36 ÷ 12 = 3 ft.',
  'multiplies when it should divide', 3)

# ---------------------------------------------------------------- customary weight and capacity
assert 3 * 16 == 48
u(16, 'pounds to ounces', 'E', 'How many ounces are in 3 pounds?',
  '48 oz', {'19 oz': '19 oz adds 3 and 16. Each pound is 16 ounces, so multiply.',
            '30 oz': '30 oz uses 10 ounces in a pound. A pound is 16 ounces.',
            '36 oz': '36 oz uses 12 ounces in a pound. 12 is inches in a foot; a pound is 16 ounces.'},
  '1 lb = 16 oz. 3 × 16 = 48 oz.',
  'uses the wrong number for the unit', 48)

assert divmod(40, 16) == (2, 8)
u(17, 'ounces to pounds and ounces', 'M', 'How much is 40 ounces in pounds and ounces?',
  '2 lb 8 oz', {'4 lb': '4 lb uses 10 ounces in a pound. A pound is 16 ounces.',
                '2 lb 4 oz': '2 lb 4 oz is only 36 ounces (32 + 4). 2 pounds is 32 ounces, and 40 − 32 = 8 left over.',
                '3 lb 4 oz': '3 lb 4 oz uses 12 ounces in a pound (3 × 12 = 36, 40 − 36 = 4). A pound is 16 ounces.'},
  '1 lb = 16 oz. Two pounds is 32 oz, and 40 − 32 = 8 oz left: 2 lb 8 oz.',
  'uses the wrong number for the unit')

assert 3 * 4 == 12
u(18, 'gallons to quarts', 'M', 'How many quarts are in 3 gallons?',
  '12 qt', {'6 qt': '6 qt uses 2 quarts in a gallon. A gallon is 4 quarts.',
            '7 qt': '7 qt adds 3 and 4. Each gallon is 4 quarts, so multiply.',
            '24 qt': '24 qt is the number of pints in 3 gallons, not quarts.'},
  '1 gal = 4 qt. 3 × 4 = 12 qt.',
  'uses the wrong number for the unit', 12)

assert 2 * 2 * 2 == 8
u(19, 'quarts to cups', 'H', 'How many cups are in 2 quarts?',
  '8 cups', {'4 cups': '4 is the number of pints in 2 quarts. Each pint is 2 cups.',
             '16 cups': '16 cups uses 8 cups in a quart. A quart is 4 cups; 16 cups is a whole gallon.',
             '32 cups': '32 cups uses 16 cups in a quart. 16 cups is a gallon, not a quart.'},
  '1 qt = 2 pt and 1 pt = 2 cups, so 1 qt = 4 cups. 2 × 4 = 8 cups.',
  'stops one step early', 8)

# ---------------------------------------------------------------- time
assert 2 * 60 + 15 == 135
u(20, 'hours and minutes to minutes', 'E', 'How many minutes are in 2 hours 15 minutes?',
  '135 min', {'120 min': '120 min is the 2 hours only. Add the 15 minutes.',
              '75 min': '75 min counts only one hour (60 + 15). There are 2 hours: 120 + 15.',
              '215 min': '215 min writes 2 and 15 side by side. An hour is 60 minutes, not 100.'},
  '1 hour = 60 minutes. 2 × 60 = 120, and 120 + 15 = 135 minutes.',
  'treats an hour as 100 minutes', 135)

assert divmod(200, 60) == (3, 20)
u(21, 'seconds to minutes and seconds', 'M', 'How long is 200 seconds?',
  '3 minutes 20 seconds', {'2 minutes': '2 minutes treats a minute as 100 seconds. A minute is 60 seconds.',
                           '20 minutes': '20 minutes divides 200 by 10. A minute is 60 seconds.',
                           '3 minutes 2 seconds': '3 × 60 = 180, and 200 − 180 = 20 seconds left over, not 2.'},
  '1 minute = 60 seconds. 3 minutes = 180 seconds, and 200 − 180 = 20, so 200 seconds = 3 minutes 20 seconds.',
  'treats a minute as 100 seconds')

# ---------------------------------------------------------------- comparing and two-step
assert 2100 > 2000 and all(g < 2000 for g in (200, 1500, 1999))
u(22, 'comparing grams with kilograms', 'M', 'Which is heavier than 2 kilograms?',
  '2,100 g', {'200 g': '200 g is far less than 2 kg, which is 2,000 g.',
              '1,500 g': '1,500 g is 1.5 kg, less than 2 kg.',
              '1,999 g': '1,999 g is just under 2,000 g, so it is 1 gram lighter than 2 kg.'},
  '2 kg = 2,000 g. Only 2,100 g is more than 2,000 g.',
  'compares the numbers without converting', 2100)

assert 2 * (200 + 50) == 500
u(23, 'perimeter with mixed units', 'H',
  'A rectangle is 2 meters long and 50 centimeters wide. What is its perimeter in centimeters?',
  '500 cm', {'104 cm': '104 cm adds 2 + 50 + 2 + 50 without changing 2 m to 200 cm.',
             '250 cm': '250 cm adds the length and the width once. A rectangle has two of each.',
             '10,000 cm': '10,000 is the area in square centimeters (200 × 50), not the perimeter.'},
  'Change 2 m to 200 cm. Perimeter = 200 + 50 + 200 + 50 = 500 cm.',
  'adds without converting; finds the area', 500)

assert 2000 // 250 == 8
u(24, 'how many batches, in mixed units', 'M',
  'A muffin recipe uses 250 grams of flour. How many batches can be made from a 2-kilogram bag of flour?',
  '8', {'80': '80 makes a zero slip in 2,000 ÷ 250. Check: 250 × 8 = 2,000.',
        '125': '125 divides 250 by 2: the wrong way round, and the bag is 2,000 grams. Divide the bag by one batch: 2,000 ÷ 250.',
        '500': '500 multiplies 250 by 2. Change the bag to grams and divide.'},
  'Change the bag to grams: 2 kg = 2,000 g. Then 2,000 ÷ 250 = 8 batches.',
  'divides without converting', 8)

if __name__ == '__main__':
    assert len(U) == 24 and len({i['id'] for i in U}) == 24
    path = 'content/question-banks/ma-units-plus.json'
    json.dump({'bank': 'ma-units-plus', 'schema_version': '1.0', 'content_version': '2026.11.21', 'items': U},
              open(path, 'w'), indent=1, ensure_ascii=False)
    open(path, 'a').write('\n')
    print(f'{path}: {len(U)} items, keys {"".join(i["correct"] for i in U)}')
