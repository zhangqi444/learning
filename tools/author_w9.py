#!/usr/bin/env python3
"""Author plan week W9 (Nov 30 – Dec 6, 2026): the last plan week before the real ISEE.

Why this exists (15 November 2026): the plan ended with Mock 3 (Nov 23–29), and the
real sitting is Saturday 12 December at BASIS Bothell, so two weeks had nothing in
them. The owner asked for them filled ("补上"), at about the size of Weeks 1–4, and a
light test week after. The real ISEE report for the 24 October sitting says what W9 is
for:

  MA 868, stanine 6. Whole Numbers 2/4 and Decimals/Percents/Fractions 3/6 hold five
     of her seven scored misses.                               -> 48 MA questions
  VR 862, stanine 7. Synonyms 11/15 and single-word completion 7/10.
                                                               -> 20 new list words,
     each asked as a synonym, and 16 of them in a sentence completion (36 questions)
  RC 870, stanine 8. Supporting Ideas 1/3, Main Idea 2/3, Organization/Logic 1/2.
                                                               -> 2 line-numbered
     passages, 16 questions, most of them going back to the text for a detail
  QR 883, stanine 8. Word Problems 30/35. Her misses on the 15 November practice
     paper were part-whole bookkeeping: doubling one side of a rectangle read as both,
     and a segment counted twice.                              -> 24 questions

Every item is written as (choices, the right one, why each wrong one is wrong). The
script puts choices in the official order (numbers ascending, words alphabetical,
phrases by length, tools/itemspec.py), works out the letters, asserts every
arithmetic key against a computation, and hashes. It also writes W9's 20 precision
words and its essay into content/precision.json and content/essay.json.
"""
import json, os, re, sys
from fractions import Fraction as F
sys.path.insert(0, os.path.dirname(__file__))
from itemspec import num, kind_of, in_official_order, content_hash

VER = '2026.11.15'
SRC = 'Original content authored for Sheila ISEE'
L = 'ABCD'

def order(vals):
    k = kind_of(vals)
    if k == 'number': return sorted(vals, key=num)
    if k == 'word': return sorted(vals, key=str.lower)
    if all(re.fullmatch(r'\d+ out of \d+', v) for v in vals):
        return sorted(vals, key=lambda v: F(*map(int, v.split(' out of '))))
    if all(re.fullmatch(r'\(\d+, \d+\)', v) for v in vals):
        return sorted(vals, key=lambda v: tuple(map(int, re.findall(r'\d+', v))))
    return sorted(vals, key=lambda v: (len(v), v))

def make(id_, subj, skill, sub, diff, prompt, key, wrong, expl, misc, value=None, **extra):
    vals = order([key] + list(wrong))
    assert len(set(vals)) == 4, id_
    assert in_official_order(vals), (id_, vals)
    if value is not None:
        assert num(key) == value, (id_, key, value)
        assert all(num(w) != value for w in wrong), (id_, 'a wrong choice equals the key')
    it = {'id': id_, 'subject': subj, 'form': 'W9', 'skill': skill, 'subskill': sub,
          'difficulty': diff, 'prompt': prompt,
          'choices': {L[i]: v for i, v in enumerate(vals)}, 'correct': L[vals.index(key)],
          'explanation': expl, 'misconceptions': misc,
          'why': {L[vals.index(w)]: t for w, t in wrong.items()}, **extra,
          'source': SRC, 'schema_version': '1.0', 'content_version': VER}
    it['content_hash'] = content_hash(it)
    return it

MA, QR, VR, RC = [], [], [], []
def ma(n, *a, **k): MA.append(make(f'MA-W9-{n:02d}', 'MA', *a, **k))
def qr(n, *a, **k): QR.append(make(f'QR-W9-{n:02d}', 'QR', *a, **k))

# ================================================================ MATHEMATICS ACHIEVEMENT
# ---- whole numbers
assert (3604215 // 100000) % 10 == 6
ma(1, 'Whole-number operations', 'value of a digit', 'E',
   'What is the value of the digit 6 in 3,604,215?',
   '600,000', {'6,000': '6,000 is two places too small. Count from the right: ones, tens, hundreds, thousands, ten thousands, hundred thousands.',
               '60,000': '60,000 is one place too small. The 6 is in the hundred thousands place.',
               '6,000,000': '6,000,000 is the millions place, where the 3 is. The 6 is one place to its right.'},
   'In 3,604,215 the 3 is in the millions place and the 6 is in the hundred thousands place, so the 6 is worth 600,000.',
   'miscounts the places', 600000)

assert 2000000 + 40000 + 300 + 5 == 2040305
ma(2, 'Whole-number operations', 'expanded form to standard form', 'M',
   'Which number equals 2,000,000 + 40,000 + 300 + 5?',
   '2,040,305', {'2,040,350': '2,040,350 puts the 5 in the tens place. The 5 is just 5 ones.',
                 '2,400,305': '2,400,305 puts the 4 in the hundred thousands place. 40,000 is 4 ten thousands.',
                 '2,403,005': '2,403,005 slides the 4 and the 3 one place too far left.'},
   'Write a 0 for every place that is not named: 2 millions, 0 hundred thousands, 4 ten thousands, 0 thousands, 3 hundreds, 0 tens, 5 ones: 2,040,305.',
   'drops or misplaces zero placeholders', 2040305)

assert round(7349, -2) == 7300
ma(3, 'Whole-number operations', 'rounding to the nearest hundred', 'E',
   'What is 7,349 rounded to the nearest hundred?',
   '7,300', {'7,000': '7,000 rounds to the nearest thousand, not the nearest hundred.',
             '7,350': '7,350 rounds to the nearest ten.',
             '7,400': '7,400 rounds up, but the tens digit is 4, which is less than 5, so round down.'},
   'Look at the tens digit, 4. It is less than 5, so the 3 hundreds stay and everything after becomes 0: 7,300.',
   'rounds to the wrong place; rounds up on a 4', 7300)

assert round(285612, -4) == 290000
ma(4, 'Whole-number operations', 'rounding to the nearest ten thousand', 'M',
   'What is 285,612 rounded to the nearest ten thousand?',
   '290,000', {'280,000': '280,000 rounds down, but the thousands digit is 5, so round up.',
               '286,000': '286,000 rounds to the nearest thousand.',
               '300,000': '300,000 rounds to the nearest hundred thousand.'},
   'The ten thousands digit is 8. Look one place right, at the thousands digit: 5. Five or more rounds up, so 28 ten thousands becomes 29: 290,000.',
   'rounds to the wrong place; rounds down on a 5', 290000)

assert 5003 - 1867 == 3136
ma(5, 'Whole-number operations', 'subtracting across zeros', 'M',
   'What is 5,003 − 1,867?',
   '3,136', {'3,236': '3,236 uses 10 − 8 = 2 in the hundreds. After regrouping, the hundreds digit is 9, so 9 − 8 = 1.',
             '4,864': '4,864 takes the smaller digit from the larger in each column (7 − 3, 6 − 0, 8 − 0). Regroup instead.',
             '6,870': '6,870 adds the numbers.'},
   'Regroup across the zeros: 5,003 becomes 4 thousands, 9 hundreds, 9 tens and 13 ones. Then 13 − 7 = 6, 9 − 6 = 3, 9 − 8 = 1 and 4 − 1 = 3: 3,136.',
   'subtracts the smaller digit from the larger; loses a regrouped digit', 3136)

assert 38 * 26 == 988
ma(6, 'Whole-number operations', 'two-digit multiplication', 'M',
   'What is 38 × 26?',
   '988', {'304': '304 adds 38 × 6 = 228 and 38 × 2 = 76, but the 2 in 26 means 20, so the second line is 760.',
           '760': '760 is only 38 × 20. Add 38 × 6 = 228 as well.',
           '1,140': '1,140 is 38 × 30. Rounding 26 up to 30 is an estimate, not the answer.'},
   '38 × 6 = 228 and 38 × 20 = 760. 228 + 760 = 988.',
   'forgets the zero for the tens line', 988)

assert 1452 // 6 == 242 and 1452 % 6 == 0
ma(7, 'Division', 'three-digit quotient', 'M',
   'What is 1,452 ÷ 6?',
   '242', {'222': '222 writes 2 for 25 ÷ 6, but 6 × 4 = 24 still fits in 25, so the middle digit is 4.',
           '252': '252 gets 5 for 25 ÷ 6, but 6 × 5 = 30, which is more than 25.',
           '8,712': '8,712 multiplies 1,452 by 6.'},
   '14 ÷ 6 = 2 with 2 left. Bring down 5: 25 ÷ 6 = 4 with 1 left. Bring down 2: 12 ÷ 6 = 2. The answer is 242 (check: 242 × 6 = 1,452).',
   'drops a remainder in the middle step', 242)

assert 150 // 12 == 12 and 150 % 12 == 6
ma(8, 'Division', 'what a remainder means in a story', 'M',
   'A baker has 150 cookies. She packs them in boxes of 12. How many boxes can she fill completely?',
   '12', {'12.5': '12.5 is the exact quotient, 150 ÷ 12, but half a box is not a full box.',
          '13': '13 counts the leftover cookies as a box, but the question asks for boxes filled completely.',
          '138': '138 subtracts 12 from 150.'},
   '150 ÷ 12 = 12 with 6 left over. Twelve boxes are full, and 6 cookies are left over.',
   'rounds up when the question asks for full groups', 12)

assert 4 * 18 + 3 * 24 == 144
ma(9, 'Whole-number operations', 'two-step multiplication and addition', 'M',
   'Ms. Lee buys 4 packs of 18 markers and 3 packs of 24 markers. How many markers does she buy in all?',
   '144', {'49': '49 adds every number in the problem (4 + 18 + 3 + 24). Each pack holds many markers, so multiply.',
           '126': '126 uses 18 for both kinds (4 × 18 + 3 × 18). The second kind has 24 in a pack.',
           '168': '168 multiplies all 7 packs by 24. Only 3 of the packs hold 24.'},
   '4 × 18 = 72 and 3 × 24 = 72. 72 + 72 = 144 markers.',
   'adds instead of multiplying; uses one pack size for both', 144)

assert 18 - 2 * 5 + 4 == 12
ma(10, 'Order of operations', 'multiplication before addition and subtraction', 'M',
   'What is the value of 18 − 2 × 5 + 4?',
   '12', {'0': '0 adds 5 + 4 first and then multiplies by 2. Add and subtract left to right, after the multiplication.',
          '4': '4 takes away both 10 and 4. After 18 − 10 = 8, the + 4 is added.',
          '84': '84 works left to right from the start, (18 − 2) × 5 + 4. Multiply first.'},
   'Multiply first: 2 × 5 = 10. Then go left to right: 18 − 10 = 8, and 8 + 4 = 12.',
   'works strictly left to right; treats + 4 as part of the subtraction', 12)

assert 84 % 7 == 0 and all(84 % d for d in (10, 8, 9))
ma(11, 'Number properties', 'factors', 'E',
   'Which number is a factor of 84?',
   '7', {'10': '10 does not divide 84: 84 ÷ 10 is 8 with 4 left over. Multiples of 10 end in 0.',
         '8': '8 does not divide 84: 84 ÷ 8 is 10 with 4 left over.',
         '9': '9 does not divide 84: 84 ÷ 9 is 9 with 3 left over (8 + 4 = 12, not a multiple of 9).'},
   '7 × 12 = 84, so 7 divides 84 with nothing left over.',
   'guesses from the digits', 7)

def isprime(n): return n > 1 and all(n % d for d in range(2, int(n ** .5) + 1))
assert isprime(29) and not any(isprime(n) for n in (21, 25, 27))
ma(12, 'Number properties', 'prime numbers', 'E',
   'Which number is prime?',
   '29', {'21': '21 = 3 × 7, so it has factors besides 1 and itself.',
          '27': '27 = 3 × 9, so it is not prime. Odd is not the same as prime.',
          '25': '25 = 5 × 5, so it is not prime.'},
   'A prime number has exactly two factors, 1 and itself. 29 cannot be divided evenly by 2, 3 or 5, so it is prime.',
   'treats every odd number as prime', 29)

ma(13, 'Number properties', 'odd and even sums', 'E',
   'The sum of two odd numbers is always',
   'even', {'odd': 'Try it: 3 + 5 = 8 and 7 + 9 = 16. The sum is never odd.',
            'a prime number': '3 + 5 = 8, and 8 is not prime.',
            'a multiple of 4': 'A multiple of 4 is not guaranteed: 3 + 7 = 10, and 10 is not a multiple of 4.'},
   'Each odd number is one more than an even number, so two odd numbers have two extra ones, which make a pair. 3 + 5 = 8, 7 + 9 = 16: always even.',
   'guesses odd + odd = odd')

assert 6000 // 30 == 200
ma(14, 'Whole-number operations', 'estimating a quotient', 'M',
   'Which is the best estimate of 6,128 ÷ 29?',
   '200', {'20': '20 drops a zero. 30 × 20 = 600, not 6,000.',
           '300': '300 divides 6,000 by 20, but 29 is much closer to 30.',
           '2,000': '2,000 adds a zero. 30 × 2,000 = 60,000.'},
   'Round to friendly numbers: 6,128 is about 6,000 and 29 is about 30. 6,000 ÷ 30 = 200.',
   'loses or adds a zero; rounds to a far number', 200)

vals = [40099, 40909, 40990, 40900]
assert max(vals) == 40990
ma(15, 'Whole-number operations', 'comparing numbers with the same digits', 'E',
   'Which number is the greatest?',
   '40,990', {'40,099': '40,099 has 0 hundreds, the fewest of the four.',
              '40,900': '40,900 has 9 hundreds, like 40,990, but 0 tens instead of 9 tens.',
              '40,909': '40,909 has 9 hundreds but 0 tens; 40,990 has 9 tens.'},
   'All four start with 40 thousand. Compare the hundreds next: three have 9 hundreds. Then compare the tens: only 40,990 has 9 tens.',
   'compares the last digits first', 40990)

ma(16, 'Whole-number operations', 'number words to digits', 'E',
   'Which number is fifty thousand six hundred eight?',
   '50,608', {'5,608': '5,608 is five thousand six hundred eight. Fifty thousand needs five digits before the hundreds.',
              '50,068': '50,068 is fifty thousand sixty-eight. "Six hundred" puts the 6 in the hundreds place.',
              '50,600': '50,600 leaves out the eight. Eight goes in the ones place.'},
   'Fifty thousand is 50,000, six hundred is 600, and eight is 8. 50,000 + 600 + 8 = 50,608. The tens place gets a 0.',
   'drops or adds a zero', 50608)

# ---- fractions
assert F(6, 8) == F(3, 4)
ma(17, 'Fractions', 'equivalent fractions', 'E',
   'Which fraction is equal to 6/8?',
   '3/4', {'5/7': '5/7 takes 1 away from the top and the bottom. To keep the same value, divide both by the same number.',
           '12/14': '12/14 adds 6 to the top and the bottom. Adding changes the value; multiplying both by 2 would give 12/16.',
           '8/6': '8/6 turns the fraction upside down. 8/6 is more than 1, and 6/8 is less than 1.'},
   'Divide the top and the bottom by 2: 6 ÷ 2 = 3 and 8 ÷ 2 = 4. 6/8 = 3/4.',
   'adds or subtracts the same number from top and bottom', F(3, 4))

assert F(5, 8) > F(3, 5) and all(f < F(3, 5) for f in (F(1, 2), F(4, 7), F(5, 9)))
ma(18, 'Fractions', 'comparing fractions with different denominators', 'H',
   'Which fraction is greater than 3/5?',
   '5/8', {'1/2': '1/2 is 0.5, and 3/5 is 0.6, so 1/2 is less.',
           '4/7': '4/7 is about 0.57, a little less than 3/5, which is 0.6.',
           '5/9': '5/9 is about 0.56, less than 3/5, which is 0.6.'},
   '3/5 = 0.6. 5/8 = 0.625, which is more. Or compare with a common denominator: 3/5 = 24/40 and 5/8 = 25/40.',
   'compares only the top numbers', F(5, 8))

assert F(3, 8) * 32 == 12
ma(19, 'Fractions', 'fraction of a group', 'E',
   'There are 32 students in the band. Three-eighths of them play drums. How many play drums?',
   '12', {'4': '4 comes from 32 ÷ 8, just one eighth. Three-eighths is three of those groups.',
          '20': '20 is the students who do not play drums (5/8 of 32).',
          '96': '96 multiplies 32 by 3 without dividing by 8.'},
   '32 ÷ 8 = 4, so 1/8 of the band is 4 students. 3/8 is 3 × 4 = 12.',
   'stops at one eighth; forgets to divide', 12)

assert 3 + F(2, 7) == F(23, 7)
ma(20, 'Fractions', 'mixed number to improper fraction', 'M',
   'Which fraction is equal to 3 2/7?',
   '23/7', {'6/7': '6/7 multiplies 3 × 2 and keeps the 7. That is less than 1, and 3 2/7 is more than 3.',
            '13/7': '13/7 multiplies 3 × 2 and adds 7. Multiply the whole number by the bottom number: 3 × 7 = 21, then add 2.',
            '32/7': '32/7 writes the 3 and 2 side by side. 3 wholes are 21 sevenths, not 30.'},
   'Each whole is 7 sevenths, so 3 wholes are 21 sevenths. Add the 2 sevenths: 21 + 2 = 23. 3 2/7 = 23/7.',
   'multiplies the wrong pair of numbers', F(23, 7))

assert F(29, 4) == 7 + F(1, 4)
ma(21, 'Fractions', 'improper fraction to mixed number', 'M',
   'Which mixed number is equal to 29/4?',
   '7 1/4', {'6 1/4': '6 1/4 is 25/4. Four sixes are 24, which leaves 5 fourths, enough for another whole.',
             '7 3/4': '7 3/4 is 31/4. 29 ÷ 4 is 7 with 1 left over, not 3.',
             '8 1/4': '8 1/4 is 33/4. Eight fours are 32, which is more than 29.'},
   '29 ÷ 4 = 7 with 1 left over. So 29/4 is 7 wholes and 1 fourth: 7 1/4.',
   'gets the remainder wrong', 7 + F(1, 4))

assert F(5, 6) - F(1, 3) == F(1, 2)
ma(22, 'Fractions', 'subtracting fractions with different denominators', 'M',
   'What is 5/6 − 1/3?',
   '1/2', {'4/6': '4/6 subtracts 1 from 5 but leaves 1/3 as it is. 1/3 is 2/6, so take away 2 sixths, not 1.',
           '7/6': '7/6 adds the fractions (5/6 + 2/6). The question subtracts.',
           '4/3': '4/3 subtracts the tops and the bottoms (5 − 1 over 6 − 3). Make the bottoms match first.'},
   'Make sixths: 1/3 = 2/6. Then 5/6 − 2/6 = 3/6, which is 1/2.',
   'subtracts tops and bottoms; does not convert to a common denominator', F(1, 2))

assert F(5, 2) + F(7, 4) == F(17, 4)
ma(23, 'Fractions', 'adding mixed numbers with regrouping', 'H',
   'What is 2 1/2 + 1 3/4?',
   '4 1/4', {'3 1/4': '3 1/4 adds the wholes (2 + 1 = 3) and keeps only the 1/4 left over from 5/4. The extra whole in 5/4 goes onto the 3.',
             '3 4/6': '3 4/6 adds the tops and the bottoms of the fractions (1 + 3 over 2 + 4). Make fourths first: 1/2 = 2/4.',
             '5 1/4': '5 1/4 counts the extra whole from 5/4 twice.'},
   'Add the wholes: 2 + 1 = 3. Add the fractions: 1/2 = 2/4, and 2/4 + 3/4 = 5/4, which is 1 1/4. 3 + 1 1/4 = 4 1/4.',
   'forgets to carry the extra whole; adds tops and bottoms', F(17, 4))

assert F(2, 5) * 15 == 6
ma(24, 'Fractions', 'fraction times a whole number', 'E',
   'What is 2/5 × 15?',
   '6', {'7 1/2': '7 1/2 is 15 ÷ 2, half of 15. Two-fifths means 2 of 5 equal parts.',
         '10': '10 takes 5 away from 15. Multiplying by 2/5 finds 2 of the 5 equal parts.',
         '37 1/2': '37 1/2 divides 15 by 2 and multiplies by 5, which is 15 × 5/2: the fraction upside down.'},
   'Split 15 into 5 equal parts: 15 ÷ 5 = 3. Two parts are 2 × 3 = 6.',
   'stops at one part; flips the fraction', 6)

assert F(3, 4) - F(1, 8) == F(5, 8)
ma(25, 'Fractions', 'subtracting fractions in a story', 'M',
   'A ribbon is 3/4 yard long. Lia cuts off 1/8 yard. How long is the ribbon now?',
   '5/8 yard', {'3/32 yard': '3/32 multiplies 3/4 by 1/8. Cutting off a piece is subtraction.',
                '1/4 yard': '1/4 is 2/8: it takes 1 from the 3 in 3/4 but then uses eighths. Change 3/4 to 6/8 first.',
                '7/8 yard': '7/8 adds the piece back on. The piece was cut off, so subtract.'},
   'Make eighths: 3/4 = 6/8. Then 6/8 − 1/8 = 5/8 yard.',
   'subtracts without a common denominator; adds instead', F(5, 8))

vals = [F(5, 6), F(7, 8), F(9, 10), F(11, 12)]
assert max(vals) == F(11, 12)
ma(26, 'Fractions', 'which fraction is closest to 1', 'M',
   'Which fraction is closest to 1?',
   '11/12', {'5/6': '5/6 is 1/6 away from 1, the biggest gap of the four.',
             '7/8': '7/8 is 1/8 away from 1. 11/12 is only 1/12 away.',
             '9/10': '9/10 is 1/10 away from 1. Twelfths are smaller pieces than tenths, so 11/12 is closer.'},
   'Each fraction is one piece short of 1. The smaller the missing piece, the closer to 1. Twelfths are the smallest pieces, so 11/12 is closest.',
   'thinks the gaps are all the same because each is "one less"', F(11, 12))

assert F(3, 2) == 1 + F(1, 2)
ma(27, 'Fractions', 'mixed number as an improper fraction', 'E',
   'Which fraction is equal to 1 1/2?',
   '3/2', {'1/2': '1/2 leaves out the whole.',
           '2/3': '2/3 turns 3/2 upside down. 2/3 is less than 1.',
           '11/2': '11/2 writes the 1 and 1 side by side. That is 5 1/2.'},
   'One whole is 2 halves. Add the other half: 2 + 1 = 3 halves, so 1 1/2 = 3/2.',
   'drops the whole; writes digits side by side', F(3, 2))

assert F(18, 24) == F(3, 4)
ma(28, 'Fractions', 'simplest form', 'M',
   'What is 18/24 in simplest form?',
   '3/4', {'5/6': '5/6 is 20/24, not 18/24. Divide 18 and 24 by the same number.',
           '7/8': '7/8 is 21/24, not 18/24.',
           '4/3': '4/3 turns 3/4 upside down. 18/24 is less than 1, so its simplest form is too.'},
   'The largest number that divides both 18 and 24 is 6. 18 ÷ 6 = 3 and 24 ÷ 6 = 4, so 18/24 = 3/4.',
   'divides top and bottom by different numbers; flips the fraction', F(3, 4))

assert F(9, 8) > 1 and all(f < 1 for f in (F(1, 9), F(7, 8), F(8, 9)))
ma(29, 'Fractions', 'fractions greater than 1', 'E',
   'Which fraction is greater than 1?',
   '9/8', {'1/9': '1/9 is one small piece of a whole, much less than 1.',
           '7/8': '7/8 is one eighth short of a whole.',
           '8/9': '8/9 uses the same digits as 9/8 but the top is smaller than the bottom, so it is less than 1.'},
   'A fraction is greater than 1 when its top number is bigger than its bottom number. 9/8 is 1 whole and 1/8 more.',
   'mixes up top and bottom', F(9, 8))

assert F(1, 3) * F(1, 2) == F(1, 6)
ma(30, 'Fractions', 'fraction of a fraction', 'H',
   'What is 1/3 of 1/2?',
   '1/6', {'1/5': '1/5 adds the bottom numbers (3 + 2). "Of" means multiply: 1 × 1 over 3 × 2.',
           '2/5': '2/5 adds the tops and the bottoms.',
           '2/3': '2/3 divides 1/3 by 1/2. Taking a third of a half makes a smaller piece.'},
   'Half of a pizza cut into 3 equal pieces makes pieces that are 1/6 of the whole pizza. 1/3 × 1/2 = 1/6.',
   'adds instead of multiplying', F(1, 6))

# ---- decimals
assert F('0.8') == F(4, 5)
ma(31, 'Decimals', 'decimal to fraction', 'E',
   'Which fraction is equal to 0.8?',
   '4/5', {'8/100': '8/100 is 0.08. The 8 in 0.8 is in the tenths place: 8/10.',
           '1/8': '1/8 is 0.125. It puts the 8 on the bottom.',
           '5/4': '5/4 is 1.25, more than 1. It turns 4/5 upside down.'},
   '0.8 is 8 tenths, 8/10. Divide the top and bottom by 2: 4/5.',
   'uses the wrong place value; flips the fraction', F(4, 5))

assert F('0.04') == F(1, 25)
ma(32, 'Decimals', 'hundredths to a fraction', 'M',
   'Which fraction is equal to 0.04?',
   '1/25', {'4/1000': '4/1000 is 0.004. 0.04 has two digits after the point, so it is hundredths: 4/100.',
            '1/4': '1/4 is 0.25. It reads the 4 as the bottom number.',
            '4/10': '4/10 is 0.4. The 4 in 0.04 is in the hundredths place.'},
   '0.04 is 4 hundredths, 4/100. Divide the top and bottom by 4: 1/25.',
   'counts the decimal places wrong', F(1, 25))

assert F(7, 20) == F('0.35')
ma(33, 'Decimals', 'fraction to decimal by making hundredths', 'M',
   'Which decimal is equal to 7/20?',
   '0.35', {'0.07': '0.07 uses only the top number. The bottom number is 20, not 100.',
            '0.72': '0.72 writes 7 and 2 side by side. A fraction bar means divide.',
            '2.86': '2.86 is about 20 ÷ 7, the division the wrong way round. 7/20 is less than 1.'},
   'Multiply the top and bottom by 5: 7/20 = 35/100 = 0.35.',
   'writes the digits side by side; divides the wrong way', F(7, 20))

assert 1 + F(3, 4) == F('1.75')
ma(34, 'Decimals', 'mixed number to decimal', 'M',
   'Which decimal is equal to 1 3/4?',
   '1.75', {'0.75': '0.75 leaves out the whole. 1 3/4 is more than 1.',
            '1.34': '1.34 writes the 3 and 4 after the point. 3/4 is 75 hundredths, not 34.',
            '1.43': '1.43 writes the digits of 3/4 backwards. 3/4 = 0.75.'},
   '3/4 = 75/100 = 0.75. Add the whole: 1 + 0.75 = 1.75.',
   'writes the digits of the fraction after the point', F(7, 4))

vals = [F('0.6'), F('0.59'), F('0.509'), F('0.06')]
assert min(vals) == F('0.06')
ma(35, 'Decimals', 'comparing decimals with different numbers of places', 'M',
   'Which number is the least?',
   '0.06', {'0.509': '0.509 has 5 tenths. 0.06 has 0 tenths, so it is smaller.',
            '0.59': '0.59 has 5 tenths; 0.06 has none.',
            '0.6': '0.6 has the fewest digits, but it is 6 tenths. 0.06 is only 6 hundredths.'},
   'Compare the tenths first: 0.6 has 6, 0.59 and 0.509 have 5, and 0.06 has 0. So 0.06 is the least.',
   'thinks fewer digits means smaller; thinks more digits means bigger', F('0.06'))

ma(36, 'Decimals', 'decimal place names', 'E',
   'In the number 4.372, which digit is in the hundredths place?',
   '7', {'2': '2 is in the thousandths place, three places after the point.',
         '3': '3 is in the tenths place, the first place after the point.',
         '4': '4 is in the ones place, before the point.'},
   'After the decimal point the places are tenths, hundredths, thousandths. In 4.372 they hold 3, 7 and 2, so the hundredths digit is 7.',
   'counts the hundreds place from the point; starts counting at the ones', 7)

assert round(6.48, 1) == 6.5
ma(37, 'Decimals', 'rounding to the nearest tenth', 'E',
   'What is 6.48 rounded to the nearest tenth?',
   '6.5', {'6': '6 rounds to the nearest whole number.',
           '6.4': '6.4 drops the 8 instead of rounding. 8 hundredths is 5 or more, so round the tenths up.',
           '7': '7 rounds to the nearest whole number, and the wrong way: 6.48 is closer to 6.'},
   'The tenths digit is 4. Look one place right, at the hundredths digit: 8. Eight is 5 or more, so 4 tenths becomes 5 tenths: 6.5.',
   'cuts off digits instead of rounding', F('6.5'))

assert F(5) - F('2.36') == F('2.64')
ma(38, 'Decimals', 'subtracting a decimal from a whole number', 'M',
   'What is 5 − 2.36?',
   '2.64', {'2.74': '2.74 forgets that a tenth was lent to the hundredths: after regrouping, 10 tenths become 9.',
            '3.36': '3.36 takes away only the 2 and keeps the .36. Write 5 as 5.00 and subtract every place.',
            '7.36': '7.36 adds the numbers.'},
   'Write 5 as 5.00. Regroup: 4 ones, 9 tenths, 10 hundredths. 10 − 6 = 4, 9 − 3 = 6, 4 − 2 = 2: 2.64.',
   'forgets to write 5 as 5.00; loses a regrouped digit', F('2.64'))

assert F('0.3') * 4 == F('1.2')
ma(39, 'Decimals', 'multiplying a decimal by a whole number', 'E',
   'What is 0.3 × 4?',
   '1.2', {'0.12': '0.12 puts two places after the point in 3 × 4 = 12, but 0.3 has only one.',
           '4.3': '4.3 adds the 4 to the 0.3.',
           '12': '12 forgets the decimal point.'},
   '3 tenths four times is 12 tenths, which is 1.2.',
   'puts the point in the wrong place', F('1.2'))

assert 6 * F('1.25') == F('7.50')
ma(40, 'Decimals', 'money times a whole number', 'M',
   'Pens cost $1.25 each. How much do 6 pens cost?',
   '$7.50', {'$6.25': '$6.25 multiplies only the dollars (6 × $1 = $6) and adds one $0.25.',
             '$8.75': '$8.75 is the cost of 7 pens.',
             '$75.00': '$75.00 loses the decimal point. 6 pens at about $1 each cost about $6, not $75.'},
   '6 × $1 = $6 and 6 × $0.25 = $1.50. $6 + $1.50 = $7.50.',
   'loses the decimal point', F('7.50'))

assert F('4.8') / 6 == F('0.8')
ma(41, 'Decimals', 'dividing a decimal by a whole number', 'M',
   'What is 4.8 ÷ 6?',
   '0.8', {'0.08': '0.08 puts the point one place too far left. 48 tenths ÷ 6 = 8 tenths.',
           '1.25': '1.25 is 6 ÷ 4.8, the division the wrong way round.',
           '8': '8 forgets the decimal point. 4.8 ÷ 6 must be less than 1.'},
   '4.8 is 48 tenths. 48 ÷ 6 = 8, so the answer is 8 tenths: 0.8.',
   'misplaces the point; divides the wrong way', F('0.8'))

assert F('1.3') < F('1.35') < F('1.4') and F('1.45') > F('1.4') and F('1.035') < F('1.3')
ma(42, 'Decimals', 'a decimal between two tenths', 'M',
   'Which number is between 1.3 and 1.4?',
   '1.35', {'1.035': '1.035 is less than 1.1. Its tenths digit is 0.',
            '1.45': '1.45 is a little more than 1.4.',
            '13.5': '13.5 is thirteen and a half. The point is in the wrong place.'},
   'Write the ends with two places: 1.30 and 1.40. 1.35 sits halfway between them.',
   'thinks more digits means a number in between', F('1.35'))

# ---- percents
assert F(30, 100) * 60 == 18
ma(43, 'Percent', 'percent of a number', 'E',
   'What is 30% of 60?',
   '18', {'2': '2 is 60 ÷ 30. 30% means 30 out of every 100.',
          '30': '30 copies the percent.',
          '42': '42 is 60 − 18, the part left over.'},
   '10% of 60 is 6. 30% is 3 times as much: 3 × 6 = 18.',
   'divides by the percent; finds the part left', 18)

assert F(7, 100) == F('0.07')
ma(44, 'Percent', 'percent to decimal', 'E',
   'Which decimal is equal to 7%?',
   '0.07', {'0.007': '0.007 is 7 thousandths. Percent means hundredths.',
            '0.7': '0.7 is 70%. 7% is 7 hundredths.',
            '7': '7 is 700%. Percent means out of 100.'},
   '7% means 7 out of 100, which is 7/100 = 0.07.',
   'puts the point in the wrong place', F('0.07'))

assert F(3, 4) == F(75, 100)
ma(45, 'Percent', 'fraction to percent', 'E',
   'What percent is equal to 3/4?',
   '75%', {'7.5%': '7.5% puts a point in 75. 3/4 is 75 out of 100.',
           '25%': '25% is 1/4, the part that is left.',
           '34%': '34% writes the 3 and 4 side by side.'},
   'Multiply the top and bottom by 25: 3/4 = 75/100 = 75%.',
   'writes the digits as a percent', 75)

assert 40 - F(25, 100) * 40 == 30
ma(46, 'Percent', 'the part that is not counted', 'M',
   'There are 40 students in a club, and 25% of them walk to school. How many do NOT walk to school?',
   '30', {'10': '10 is the students who do walk. The question asks about the others.',
          '15': '15 takes 25 students away from 40. 25% of 40 is 10 students, not 25.',
          '25': '25 copies the percent.'},
   '25% is one quarter. 40 ÷ 4 = 10 walk, so 40 − 10 = 30 do not.',
   'answers the part that does; subtracts the percent as a number', 30)

assert F(7, 20) == F(35, 100)
ma(47, 'Percent', 'percent to fraction in simplest form', 'M',
   'Which fraction is equal to 35%?',
   '7/20', {'1/35': '1/35 is less than 3%. It puts the 35 on the bottom.',
            '35/1000': '35/1000 is 3.5%. Percent means out of 100.',
            '3/5': '3/5 is 60%. It uses the digits 3 and 5 as a fraction.'},
   '35% = 35/100. Divide the top and bottom by 5: 7/20.',
   'misreads percent as a place value', F(7, 20))

assert 60 - F(20, 100) * 60 == 48
ma(48, 'Percent', 'price after a percent discount', 'M',
   'A game costs $60. It is on sale for 20% off. What is the sale price?',
   '$48', {'$12': '$12 is the amount taken off. The question asks for the new price.',
           '$40': '$40 takes off 20 dollars. 20% of $60 is $12.',
           '$72': '$72 adds the $12. "Off" means take it away.'},
   '10% of $60 is $6, so 20% is $12. $60 − $12 = $48.',
   'stops at the discount; subtracts the percent as dollars', 48)

# ================================================================ QUANTITATIVE REASONING
assert (5 * 6) // (5 * 3) == 2
qr(1, 'Area', 'one side doubled', 'M',
   'A rectangle is 5 inches long and 3 inches wide. If its width is doubled and its length stays the same, how many times as large is the new area?',
   '2', {'4': '4 is what happens when BOTH sides are doubled. Here only the width changes.',
         '6': '6 is the new width. The question asks how many times the area grows.',
         '8': '8 adds the two sides of the original rectangle (5 + 3) and does not compare areas.'},
   'The old area is 5 × 3 = 15. The new area is 5 × 6 = 30. 30 is 2 times 15. Doubling one side doubles the area.',
   'doubles both sides; answers a length', 2)

assert (8 * 8) // (4 * 4) == 4
qr(2, 'Area', 'both sides doubled', 'M',
   'A square has sides 4 centimeters long. If every side is doubled, how many times as large is the new area?',
   '4', {'2': '2 would be right if only one side were doubled. Both the length and the width double, so the area doubles twice.',
         '8': '8 is the new side length, not how many times the area grows.',
         '16': '16 is the old area (4 × 4), not how many times the area grows.'},
   'The old area is 4 × 4 = 16. The new square has sides of 8, so its area is 8 × 8 = 64. 64 ÷ 16 = 4.',
   'treats doubling both sides like doubling one', 4)

assert 2 * (10 + 2) - 2 * (7 + 2) == 6
qr(3, 'Perimeter', 'how perimeter changes', 'M',
   'A rectangle is 7 meters long and 2 meters wide. Its length is made 3 meters longer. By how many meters does the perimeter increase?',
   '6', {'9': '9 adds 3 three times. Only the two long sides change.',
         '12': '12 adds 3 to all four sides. The widths stay 2 meters.',
         '24': '24 is the new perimeter. The question asks how much it grew: 24 − 18.'},
   'The old perimeter is 2 × (7 + 2) = 18. The new one is 2 × (10 + 2) = 24. 24 − 18 = 6, because both long sides grew by 3.',
   'adds the change to one side only', 6)

assert 12 - 5 - 3 == 4
qr(4, 'Measurement', 'segments on a line', 'M',
   'Points A, B, C and D are on a line in that order. AB is 5, BC is 3 and AD is 12. What is the length of CD?',
   '4', {'7': '7 is 12 − 5, the length of BD. BC is part of BD, so take it away too.',
         '9': '9 is 12 − 3. It leaves out AB.',
         '20': '20 adds all three lengths. AD already includes AB and BC.'},
   'AD is the whole line: AB + BC + CD = 12. So 5 + 3 + CD = 12, and CD = 4.',
   'forgets a piece; adds a length that is already inside another', 4)

assert 10 + 9 - 4 == 15
qr(5, 'Measurement', 'overlapping segments', 'H',
   'Points A, B, C and D are on a line in that order. AC is 10, BD is 9 and BC is 4. What is the length of AD?',
   '15', {'5': '5 is CD alone (9 − 4). AD runs all the way from A to D.',
          '6': '6 is AB alone (10 − 4). AD runs all the way from A to D.',
          '13': '13 adds BD and BC (9 + 4), counting BC twice and leaving out AB.'},
   'AC and BD overlap on BC. AC + BD = 19 counts BC twice, so take it away once: 19 − 4 = 15. (Or: AB = 10 − 4 = 6, CD = 9 − 4 = 5, and 6 + 4 + 5 = 15.)',
   'counts the overlap twice', 15)

assert 18 + 12 - 5 == 25
qr(6, 'Mixed reasoning', 'counting a group with an overlap', 'M',
   'In a class, 18 students like soccer and 12 like basketball. Five of them like both. How many students like at least one of the two sports?',
   '25', {'5': '5 is only the students who like both sports.',
          '7': '7 is the students who like basketball only (12 − 5).',
          '13': '13 is the students who like soccer only (18 − 5).'},
   '18 + 12 = 30 counts the 5 who like both twice. Take them away once: 30 − 5 = 25.',
   'counts the overlap twice', 25)

assert 28 - (15 + 9 - 4) == 8
qr(7, 'Mixed reasoning', 'how many are in neither group', 'H',
   'There are 28 students in a class. Fifteen have a dog, 9 have a cat, and 4 have both. How many students have neither a dog nor a cat?',
   '8', {'4': '4 takes 15 + 9 = 24 away from 28, but the 4 with both pets were counted twice in the 24.',
         '20': '20 is the students who have at least one pet (15 + 9 − 4). The question asks about the others.',
         '24': '24 adds 15 and 9, counting the 4 with both pets twice, and it is not the number without pets.'},
   'Students with a pet: 15 + 9 − 4 = 20 (the 4 were counted in both groups). Students without: 28 − 20 = 8.',
   'counts the overlap twice; answers the wrong group', 8)

assert (19 - 4) // 3 == 5
qr(8, 'Algebraic reasoning', 'working backwards', 'M',
   'If 3 × □ + 4 = 19, what number goes in the box?',
   '5', {'15': '15 is 19 − 4, which is 3 × □. Divide by 3 to find □.',
         '23': '23 adds 4 to 19. Undo + 4 by subtracting.',
         '57': '57 multiplies 19 by 3. Undo × 3 by dividing.'},
   'Undo the steps in reverse: 19 − 4 = 15, then 15 ÷ 3 = 5. Check: 3 × 5 + 4 = 19.',
   'stops halfway; undoes with the wrong operation', 5)

assert 3 + 9 * 4 == 39
qr(9, 'Pattern', 'a term far along a pattern', 'M',
   'The pattern 3, 7, 11, 15, … adds 4 each time. What is the 10th number in the pattern?',
   '39', {'31': '31 is the 8th number. Count the terms: the 10th is two more steps.',
          '35': '35 is the 9th number. Count the terms: the 10th is one more step.',
          '36': '36 is 9 × 4, the nine steps without the 3 the pattern starts at.'},
   'From the 1st number to the 10th there are 9 steps of 4. 3 + 9 × 4 = 3 + 36 = 39.',
   'counts one step too many or too few', 39)

assert F(3, 12) == F('0.25')
qr(10, 'Unit rate', 'cost of one unit', 'E',
   'A 12-ounce bottle of juice costs $3.00. What is the cost per ounce?',
   '$0.25', {'$0.36': '$0.36 multiplies 3 by 12 instead of dividing. Share $3.00 among 12 ounces.',
             '$0.40': '$0.40 for 12 ounces would be $4.80.',
             '$4.00': '$4.00 is 12 ÷ 3, the division the wrong way round. One ounce cannot cost more than the bottle.'},
   '$3.00 ÷ 12 = $0.25. Check: 12 × $0.25 = $3.00.',
   'divides the wrong way', F('0.25'))

assert 40 // (3 + 5) * 3 == 15
qr(11, 'Ratio', 'sharing in a ratio', 'H',
   'A bag has 3 red marbles for every 5 blue marbles. There are 40 marbles in all. How many are red?',
   '15', {'8': '8 is the number of marbles in one group of 3 red and 5 blue.',
          '24': '24 is 3 × 8. There are 5 groups of 8, so red is 3 × 5.',
          '25': '25 is the number of blue marbles.'},
   'Each group of 3 red and 5 blue holds 8 marbles. 40 ÷ 8 = 5 groups. Red: 5 × 3 = 15.',
   'mixes up the size of a group with the number of groups', 15)

assert (80 + 90 + 70 + 100) // 4 == 85
qr(12, 'Mean', 'average of four scores', 'E',
   'Ana scored 80, 90, 70 and 100 on four quizzes. What is her average score?',
   '85', {'80': '80 is the first score. Add all four and share them out.',
          '90': '90 is one of her scores. The mean is the total divided by 4.',
          '340': '340 is the total. Divide it by 4 to find the average.'},
   '80 + 90 + 70 + 100 = 340. 340 ÷ 4 = 85.',
   'stops at the total', 85)

assert 28 % 5 == 3 and all(n % 5 != 3 for n in (25, 26, 35))
qr(13, 'Remainders', 'which number leaves a given remainder', 'M',
   'When a number is divided by 5, the remainder is 3. Which could be the number?',
   '28', {'25': '25 ÷ 5 = 5 with no remainder.',
          '26': '26 ÷ 5 = 5 with 1 left over.',
          '35': '35 ÷ 5 = 7 with no remainder. It ends in 5, not 3 or 8.'},
   'A number that leaves 3 when divided by 5 ends in 3 or 8. 28 = 5 × 5 + 3.',
   'confuses remainder with a digit', 28)

qr(14, 'Parity', 'odd and even expressions', 'M',
   'The letter n stands for an odd number. Which expression must be even?',
   'n + 1', {'3n': '3 times an odd number is odd: 3 × 5 = 15.',
             'n + 2': 'An odd number plus 2 is the next odd number: 5 + 2 = 7.',
             '2n + 1': '2n is even, and one more than an even number is odd.'},
   'Try n = 5: n + 1 = 6, which is even. Adding 1 to any odd number reaches the next even number.',
   'adds an even amount and expects the parity to change')

assert 49650 + 1000 == 50650
qr(15, 'Number sense', 'adding 1,000 across a ten-thousand', 'M',
   'What number is 1,000 more than 49,650?',
   '50,650', {'49,750': '49,750 adds 100, not 1,000.',
              '59,650': '59,650 adds 10,000.',
              '149,650': '149,650 adds 100,000.'},
   'Add 1 to the thousands digit. 49 thousand + 1 thousand = 50 thousand, so the answer is 50,650.',
   'adds to the wrong place', 50650)

qr(16, 'Measurement', 'elapsed time', 'M',
   'A movie starts at 6:45 p.m. and lasts 1 hour 50 minutes. When does it end?',
   '8:35 p.m.', {'7:35 p.m.': '7:35 p.m. adds only the 50 minutes, not the hour.',
                 '8:25 p.m.': '8:25 p.m. adds 1 hour 40 minutes.',
                 '8:45 p.m.': '8:45 p.m. adds 2 whole hours, 10 minutes too many.'},
   '6:45 + 1 hour = 7:45. Then 50 more minutes: 15 minutes reaches 8:00, and 35 more makes 8:35 p.m.',
   'adds only the minutes; rounds the time', F(20 * 60 + 35))

assert 3 * 3 == 9
qr(17, 'Measurement', 'converting yards to feet', 'E',
   'A rope 3 yards long is cut into pieces that are each 1 foot long. How many pieces are there?',
   '9', {'3': '3 counts yards, not feet. Each yard is 3 feet.',
         '12': '12 uses 4 feet in a yard. A yard is 3 feet.',
         '36': '36 is the number of inches in a yard.'},
   'One yard is 3 feet, so 3 yards are 3 × 3 = 9 feet. That makes 9 one-foot pieces.',
   'uses the wrong conversion', 9)

assert 24 // 6 == 4 and 2 * (6 + 4) == 20
qr(18, 'Perimeter', 'perimeter from area and one side', 'M',
   'A rectangle has an area of 24 square feet and a length of 6 feet. What is its perimeter?',
   '20 feet', {'4 feet': '4 feet is the width (24 ÷ 6). The question asks for the perimeter.',
               '10 feet': '10 feet adds the length and the width once. A rectangle has two of each.',
               '24 feet': '24 is the area. Perimeter is the distance around.'},
   'Width = 24 ÷ 6 = 4 feet. Perimeter = 6 + 4 + 6 + 4 = 20 feet.',
   'stops at the width; mixes up area and perimeter', 20)

assert 1 - F(2, 5) - F(1, 3) == F(4, 15)
qr(19, 'Fractions', 'fraction left after two parts', 'H',
   'Jon read 2/5 of a book on Monday and 1/3 of it on Tuesday. What fraction of the book does he still have to read?',
   '4/15', {'1/15': '1/15 is 2/5 − 1/3, the difference between the two days. The question asks what is left of the whole book.',
            '5/8': '5/8 adds the tops and bottoms (2 + 1 over 5 + 3) and takes that from 1.',
            '11/15': '11/15 is how much he has read. Take it away from 1.'},
   'Use fifteenths: 2/5 = 6/15 and 1/3 = 5/15. He has read 11/15, so 15/15 − 11/15 = 4/15 is left.',
   'stops at the part read; adds tops and bottoms', F(4, 15))

assert 5 * 6 - (4 + 5 + 7 + 8) == 6
qr(20, 'Mean', 'missing value for a mean', 'H',
   'The mean of five numbers is 6. Four of the numbers are 4, 5, 7 and 8. What is the fifth number?',
   '6', {'8': '8 is the largest of the four numbers given, not the missing one.',
         '24': '24 is the total of the four numbers given. The five numbers must total 30.',
         '30': '30 is the total of all five. Take away the four you know.'},
   'A mean of 6 for 5 numbers means a total of 5 × 6 = 30. 4 + 5 + 7 + 8 = 24, so the fifth number is 30 − 24 = 6.',
   'stops at a total', 6)

qr(21, 'Coordinates', 'moving a point', 'M',
   'The point (3, 5) is moved 4 units right and 2 units down. Where is it now?',
   '(7, 3)', {'(1, 7)': '(1, 7) moves left 2 and up 2: the wrong way both times, and only 2 across instead of 4.',
              '(5, 9)': '(5, 9) moves the first number by 2 and the second by 4, and goes up: the moves are swapped.',
              '(7, 7)': '(7, 7) moves up 2 instead of down 2.'},
   'Right 4 adds 4 to the first number: 3 + 4 = 7. Down 2 takes 2 from the second: 5 − 2 = 3. The point is (7, 3).',
   'moves the wrong way; swaps the moves')

qr(22, 'Probability', 'chance of not picking a color', 'M',
   'A bag holds 3 red, 6 blue and 1 green marble. One marble is picked without looking. What is the chance it is NOT blue?',
   '4 out of 10', {'1 out of 10': '1 out of 10 is the chance of green only. Red is not blue either.',
                   '3 out of 10': '3 out of 10 is the chance of red only. Green is not blue either.',
                   '6 out of 10': '6 out of 10 is the chance it IS blue.'},
   'There are 3 + 6 + 1 = 10 marbles. Not blue means red or green: 3 + 1 = 4. The chance is 4 out of 10.',
   'answers the opposite event; counts only one color')

qr(23, 'Mixed reasoning', 'what must be true', 'M',
   "Every student in Ms. Ray's class plays an instrument. Ben does not play an instrument. Which statement must be true?",
   "Ben is not in Ms. Ray's class.", {"Ben plays a sport.": 'Nothing in the facts mentions sports.',
                                       "Ben is in Ms. Ray's class.": 'If he were, he would play an instrument, and he does not.',
                                       "Some of Ms. Ray's students do not play.": 'The first fact says every student in the class plays.'},
   'Everyone in the class plays. Ben does not play. So Ben cannot be in the class.',
   'brings in something not stated; contradicts a fact')

assert 50 * 50 == 2500
qr(24, 'Estimation', 'estimating a product', 'E',
   'Which is closest to 49 × 51?',
   '2,500', {'250': '250 drops a zero. 50 × 50 = 2,500.',
             '2,000': '2,000 rounds 49 and 51 to 40 and 50, but both are close to 50.',
             '2,450': '2,450 is 49 × 50. The other number is 51, one more than 50, which adds about 49 more.'},
   'Both numbers are close to 50, and 50 × 50 = 2,500. (The exact answer is 2,499.)',
   'loses or adds a zero', 2500)

# ================================================================ VERBAL REASONING
# The 20 words of W9's list. Each is asked as a synonym; 16 also as a sentence completion.
WORDS = [
 # word, pos, meaning, example, usage, connotation
 ('arduous', 'adjective', 'very hard; needing a lot of effort', 'The climb to the top of the dune was so arduous that we stopped every few minutes.', 'Used for tasks, journeys and work. Not for people.', 'negative'),
 ('bewildered', 'adjective', 'confused and puzzled', 'The new student looked bewildered by the long hallways and the bells.', 'Often "bewildered by" something. Related: bewilder.', 'neutral'),
 ('dispel', 'verb', 'to drive away; to make a feeling or an idea go away', 'The bright kitchen light dispelled her fear of the dark house.', 'You dispel a fear, a doubt, a rumor or a myth.', 'positive'),
 ('elated', 'adjective', 'extremely happy and excited', 'Jamal was elated when his name was called as the winner.', 'Stronger than happy. Related: elation.', 'positive'),
 ('emerge', 'verb', 'to come out or come into view', 'A chick emerged from the cracked egg.', 'Often "emerge from" a place. Related: emergence.', 'neutral'),
 ('feasible', 'adjective', 'possible to do; able to be done', 'Building a tree house in one afternoon was not feasible, so they planned for two weekends.', 'Used for plans and ideas.', 'neutral'),
 ('feeble', 'adjective', 'very weak', 'The sick puppy gave a feeble wag of its tail.', 'Can be weak in body, or a weak effort or excuse: a feeble excuse.', 'negative'),
 ('forlorn', 'adjective', 'lonely and sad; left alone', 'A forlorn umbrella lay in the empty playground after the rain.', 'Often used for a person, animal or place that seems abandoned.', 'negative'),
 ('haughty', 'adjective', 'proud in a way that looks down on others', 'The haughty cat would not even look at the dog.', 'Not the same as naughty, which means badly behaved.', 'negative'),
 ('immense', 'adjective', 'extremely large; huge', 'An immense whale swam under the boat.', 'Stronger than big or large.', 'neutral'),
 ('lethargic', 'adjective', 'slow and tired; without energy', 'The heat made everyone lethargic, and no one wanted to play tag.', 'Related: lethargy.', 'negative'),
 ('obsolete', 'adjective', 'no longer used because something newer has replaced it', 'Once phones had cameras, many small cameras became obsolete.', 'Used for tools, machines and ideas.', 'neutral'),
 ('obstinate', 'adjective', 'stubborn; refusing to change your mind', 'The obstinate goat would not move off the path.', 'Close to stubborn. Not the same as obedient.', 'negative'),
 ('perilous', 'adjective', 'full of danger', 'Crossing the frozen river was perilous because the ice was thin.', 'Related: peril, which means danger.', 'negative'),
 ('persevere', 'verb', 'to keep trying even when it is hard', 'She persevered with the puzzle until the last piece fit.', 'Related: perseverance.', 'positive'),
 ('placid', 'adjective', 'calm and peaceful; not easily upset', 'The placid lake looked like a mirror.', 'Used for water, animals and people.', 'positive'),
 ('ravenous', 'adjective', 'extremely hungry', 'After soccer practice, Leo was ravenous and ate three sandwiches.', 'Stronger than hungry.', 'neutral'),
 ('recede', 'verb', 'to move back or away', 'After the storm, the floodwater slowly receded from the streets.', 'Water, a sound or a hairline can recede. The opposite of advance.', 'neutral'),
 ('robust', 'adjective', 'strong and healthy; hard to break', 'The robust little plant survived the frost.', 'Used for people, plants, things and plans.', 'positive'),
 ('spontaneous', 'adjective', 'done suddenly, without planning', 'The class broke into spontaneous applause when the shy boy finished his song.', 'Related: spontaneously.', 'neutral'),
]
assert len(WORDS) == 20 and len({w[0] for w in WORDS}) == 20

SYN = {
 'arduous': ('difficult', {'eager': 'Eager means wanting very much to do something. Arduous describes the task, not how keen you are; it is easy to mix up with ardent.', 'easy': 'Easy is the opposite: an arduous job takes a lot of effort.', 'boring': 'Boring means dull. An arduous task can be exciting and still very hard.'}),
 'bewildered': ('confused', {'delighted': 'Delighted means very pleased. A bewildered person is puzzled, not pleased.', 'frightened': 'Frightened means scared. You can be bewildered without being afraid.', 'wild': 'Wild is hidden inside bewildered, but it means untamed or out of control, not confused.'}),
 'dispel': ('drive away', {'gather': 'Gather means bring together, nearly the opposite of driving away.', 'spell out loud': 'Spell out loud uses the letters of dispel, but it means say each letter of a word.', 'invite': 'Invite means ask someone to come, the opposite of driving them away.'}),
 'elated': ('overjoyed', {'delayed': 'Delayed looks like late, which is hidden in elated, but elated is about joy, not time.', 'nervous': 'Nervous means worried. Elated is a strong, happy feeling.', 'lonely': 'Lonely means sad from being alone. Elated means bursting with happiness.'}),
 'emerge': ('come out', {'sink': 'Sink means go down out of sight, the opposite of emerging into view.', 'hurry': 'Hurry means move fast. Something can emerge slowly.', 'join together': 'Join together is what merge means. Emerge has merge inside it, but it means come out.'}),
 'feasible': ('possible', {'delicious': 'Delicious means tasty. Feasible may look like feast, but it is about whether a plan can be done.', 'unlikely': 'Unlikely means probably will not happen. A feasible plan is one that can be done.', 'impossible': 'Impossible is the opposite of feasible.'}),
 'feeble': ('weak', {'fearful': 'Fearful means afraid. A feeble person may be brave but has little strength.', 'wild': 'Wild means untamed and rough. Feeble is about having little strength.', 'angry': 'Angry is a feeling of being cross; feeble is about lacking strength.'}),
 'forlorn': ('lonely', {'cheerful': 'Cheerful is the opposite: a forlorn person is sad and alone.', 'forgetful': 'Forgetful starts like forlorn, but it means often forgetting things.', 'angry': 'Angry means cross. Forlorn is sad and alone, not angry.'}),
 'haughty': ('arrogant', {'hungry': 'Hungry means wanting food; haughty is about acting above others.', 'humble': 'Humble is the opposite: a humble person does not look down on anyone.', 'naughty': 'Naughty rhymes with haughty, but it means badly behaved, not proud.'}),
 'immense': ('huge', {'heavy': 'Heavy is about weight. Immense is about size.', 'immediate': 'Immediate begins the same way, but it means happening right now.', 'tiny': 'Tiny is the opposite of immense.'}),
 'lethargic': ('sluggish', {'curious': 'Curious means wanting to know things. Lethargic is about having no energy.', 'energetic': 'Energetic is the opposite of lethargic.', 'nervous': 'Nervous means worried and jumpy; a lethargic person is slow and tired.'}),
 'obsolete': ('out of date', {'stubborn': 'Stubborn means obstinate, another word that starts with ob-. Obsolete is about things that are no longer used.', 'brand-new and shiny': 'Brand-new and shiny is the opposite: an obsolete thing has been replaced by something newer.', 'hard to see': 'Hard to see is what obscure means. Obsolete means out of date.'}),
 'obstinate': ('stubborn', {'thoughtful': 'Thoughtful means kind and considerate. Obstinate is about refusing to change your mind.', 'obedient': 'Obedient starts with ob- too, but it means doing what you are told: nearly the opposite.', 'obvious': 'Obvious means easy to see. It only looks like obstinate.'}),
 'perilous': ('dangerous', {'peaceful': 'Peaceful is calm and safe, the opposite of perilous.', 'perfect': 'Perfect starts with per- too, but it means without any faults.', 'precious': 'Precious means very valuable. It has nothing to do with danger.'}),
 'persevere': ('keep trying', {'complain loudly': 'Complain loudly means say you are unhappy. You can persevere without complaining.', 'give up': 'Give up is the opposite of persevere.', 'rest': 'Rest means stop for a while; persevering means keep going.'}),
 'placid': ('calm', {'angry': 'Angry is the opposite: a placid person is not easily upset.', 'plain': 'Plain means simple. It starts the same way, but placid means calm.', 'playful': 'Playful means full of fun. Placid is quiet and peaceful.'}),
 'ravenous': ('starving', {'dark': 'Dark fits a raven, a black bird, but ravenous means very hungry.', 'sleepy': 'Sleepy means needing to sleep, not to eat.', 'angry': 'Angry is about temper. Ravenous is about hunger.'}),
 'recede': ('move back', {'come closer': 'Come closer is the opposite of recede.', 'grow': 'Grow means get bigger. Receding water gets farther away.', 'repeat': 'Repeat means do again. It starts with re- too, but recede means move back.'}),
 'robust': ('strong', {'fragile': 'Fragile is the opposite: easy to break.', 'loud': 'Loud is about sound, not strength.', 'rusty': 'Rusty means covered in rust, which a strong thing can be, but robust means strong and healthy.'}),
 'spontaneous': ('unplanned', {'polite': 'Polite means having good manners. Spontaneous is about acting without planning.', 'slow': 'Slow is about speed. Spontaneous things often happen quickly, without thought ahead.', 'carefully planned': 'Carefully planned is the opposite of spontaneous.'}),
}
for i, (w, pos, meaning, *_ ) in enumerate(WORDS, 1):
    key, wrong = SYN[w]
    VR.append(make(f'VR-W9-S-{i:02d}', 'VR', 'vocabulary', f'synonym — {pos.split("/")[0]}', 'M',
                   f'{w.upper()} most nearly means:', key, wrong,
                   f'{w.capitalize()} means {meaning}, so "{key}" is the closest match.',
                   'picks a word that looks or sounds like the headword', word=w))

COMP = [
 ('feeble', 'The kitten was so ____ after its illness that it could barely lift its head.', {'fierce': 'Fierce means wild and strong, but the kitten can barely lift its head.', 'playful': 'Playful means full of fun; a kitten that cannot lift its head is not playing.', 'sturdy': 'Sturdy means strong, the opposite of what "barely lift its head" shows.'}, 'cause clue', '"Barely lift its head" shows the kitten has almost no strength, so it is feeble, very weak.'),
 ('immense', 'Next to the tiny rowboat, the ocean liner looked ____.', {'narrow': 'Narrow means thin. The sentence compares size, and a liner beside a rowboat looks huge.', 'shallow': 'Shallow means not deep; the sentence is comparing size.', 'tiny': 'Tiny describes the rowboat. "Next to" sets up a contrast.'}, 'contrast clue', 'The sentence contrasts the liner with a tiny boat, so the liner looks immense, extremely large.'),
 ('placid', 'Although the river had been wild during the storm, by morning it was ____ enough to reflect the trees.', {'rapid': 'Rapid means fast-moving. Although signals a change from wild, and fast water cannot reflect like a mirror.', 'roaring': 'Roaring means loud and wild, which is how the river was before; although says it changed.', 'violent': 'Violent means wild and destructive, which describes the storm, not the calm morning.'}, 'contrast clue', 'Although signals a change from wild. Water calm enough to reflect trees is placid.'),
 ('elated', 'Mira was ____ when she learned she had won the art contest, and she hugged everyone in the room.', {'bored': 'Bored means uninterested; nobody hugs everyone because they are bored.', 'jealous': 'Jealous means wanting what someone else has, but Mira is the one who won.', 'weary': 'Weary means very tired, and hugging everyone shows excitement.'}, 'cause clue', 'Winning the contest and hugging everyone show she was elated, extremely happy.'),
 ('emerge', 'After hiding in its shell all morning, the turtle began to ____ once the noise stopped.', {'retreat': 'Retreat means pull back, which is what it did while hiding; the noise stopping lets it come out.', 'shrink': 'Shrink means get smaller. The turtle is coming out, not shrinking.', 'vanish': 'Vanish means disappear, the opposite of coming out of the shell.'}, 'time-order clue', 'It had been hiding, and the danger is over, so the turtle begins to emerge, to come out.'),
 ('obsolete', 'Now that almost everyone takes pictures with a phone, the old film camera seems ____.', {'modern': 'Modern means new and up to date, the opposite of what the phone has done to the camera.', 'popular': 'Popular means liked by many people, but almost everyone uses a phone instead.', 'recent': 'Recent means new, and the film camera is old.'}, 'cause clue', 'Something newer has replaced it, so the film camera seems obsolete, out of date.'),
 ('persevere', 'Even though her first ten tries failed, Dana chose to ____ until the bridge she built could hold the weight.', {'complain': 'Complain means say she is unhappy, which would not make the bridge hold the weight.', 'hesitate': 'Hesitate means pause before acting. Dana kept building "until" it worked.', 'give up': 'Give up is the opposite; "until the bridge could hold" shows she kept going.'}, 'contrast clue', 'Even though ten tries failed, she kept going until it worked: she chose to persevere.'),
 ('robust', 'Unlike the thin paper cups, these ____ mugs survived being dropped on the floor.', {'delicate': 'Delicate means easy to break, like the paper cups; unlike sets up the opposite.', 'flimsy': 'Flimsy means thin and weak, which describes the paper cups.', 'shallow': 'Shallow means not deep, which says nothing about surviving a fall.'}, 'contrast clue', 'Unlike the thin cups, these mugs did not break, so they are robust, strong.'),
 ('arduous', 'The climb was so ____ that the hikers had to stop and rest every few minutes.', {'brief': 'Brief means short. A short climb would not need rest every few minutes.', 'effortless': 'Effortless means easy, the opposite of needing rest.', 'gentle': 'Gentle means mild and easy; the hikers needed rest every few minutes.'}, 'cause clue', 'Resting every few minutes shows the climb was arduous, very hard.'),
 ('bewildered', 'The new student looked ____ as she stared at the map, unable to find her classroom.', {'confident': 'Confident means sure of yourself, but she cannot find her room.', 'delighted': 'Delighted means very pleased; being lost is not pleasing.', 'relaxed': 'Relaxed means calm and easy; staring at a map unable to find the room is not.'}, 'cause clue', 'She cannot find her classroom, so she looks bewildered, confused.'),
 ('dispel', "The teacher's calm explanation helped ____ the rumor that school would be canceled.", {'invent': 'Invent means make up. The rumor already existed; the explanation answered it.', 'repeat': 'Repeat means say again, which would spread the rumor, not stop it.', 'spread': 'Spread means send to more people, the opposite of what a calm explanation does.'}, 'cause clue', 'A calm explanation makes a false rumor go away: it helps dispel it.'),
 ('haughty', 'The ____ queen refused to speak to anyone she thought was beneath her.', {'generous': 'Generous means giving and kind, not someone who ignores people.', 'humble': 'Humble means not proud, the opposite of looking down on people.', 'timid': 'Timid means shy. She refused to speak because she looked down on them, not out of shyness.'}, 'definition clue', 'Treating others as "beneath her" is what haughty means.'),
 ('lethargic', 'After staying up too late, Owen felt ____ and wanted to lie on the couch all day.', {'eager': 'Eager means keen to do something, but Owen wants to do nothing.', 'energetic': 'Energetic is the opposite of wanting to lie on the couch all day.', 'restless': 'Restless means unable to keep still, but Owen wants to lie still all day.'}, 'cause clue', 'Too little sleep and wanting to lie down all day show Owen felt lethargic, slow and tired.'),
 ('obstinate', 'No matter how many reasons his sister gave, the ____ boy would not change his mind.', {'willing': 'Willing means ready to go along, the opposite of not changing his mind.', 'cooperative': 'Cooperative means willing to work together and go along with others.', 'flexible': 'Flexible means willing to change, the opposite of what the boy does.'}, 'definition clue', 'Refusing to change his mind no matter what is what obstinate means.'),
 ('perilous', 'Sailors feared the ____ waters near the rocks, where many ships had sunk.', {'calm': 'Calm water would not be feared; many ships had sunk there.', 'harmless': 'Harmless means safe, but ships sank there.', 'peaceful': 'Peaceful means quiet and safe, not water that sinks ships.'}, 'cause clue', 'Ships had sunk there and sailors feared it, so the waters were perilous, dangerous.'),
 ('ravenous', 'After the long hike with no lunch, the children were ____ and ate every bite of dinner.', {'full': 'Full means not hungry, but they had missed lunch and ate every bite.', 'picky': 'Picky eaters leave food; these children ate every bite.', 'content': 'Content means satisfied, but children who missed lunch and ate every bite were hungry, not already satisfied.'}, 'cause clue', 'No lunch and eating every bite show they were ravenous, extremely hungry.'),
]
assert len(COMP) == 16 and all(w in SYN for w, *_ in COMP)
for i, (w, stem, wrong, clue, expl) in enumerate(COMP, 1):
    assert '____' in stem
    VR.append(make(f'VR-W9-C-{i:02d}', 'VR', 'vocabulary', f'sentence completion — {clue}', 'M',
                   stem, w, wrong, expl, 'ignores the clue words in the sentence', word=w))

# ================================================================ READING COMPREHENSION
P1 = """When Nadia's family moved to Larkspur, the first thing
she wanted to find was the public library. Her mother drew
a map on the back of an envelope: left at the bakery,
straight past the park, right at the fire station. "It is
only ten minutes," her mother said. "You can't miss it."

Nadia missed it. She turned left at the first bakery she
saw, not knowing that Larkspur had two. Twenty minutes
later she was standing at the edge of a field with a creek
running through it, holding an envelope that no longer made
any sense.

An older man was kneeling beside the creek with a net.
"Lost?" he asked, without looking up. Nadia showed him the
map. He studied it, then laughed. "Wrong bakery," he said.
"Everyone does that the first week." He pointed with his
net toward a row of roofs. "The library is that way. But if
you wait five minutes, I'll walk you there. I'm going anyway."

While she waited, he showed her what he was catching: tiny
insects that clung to the undersides of stones. He explained
that they could live only in clean, cold water, so finding
them meant the creek was healthy. Every Saturday he wrote
the number he found in a notebook, and he had done it for
eleven years.

At the library, he walked straight to the front desk and
handed the librarian his notebook. She copied the numbers
into a binder labeled "Larkspur Creek Watch." Then she
turned to Nadia. "Are you new? We are looking for
volunteers to help count on Saturdays."

Nadia looked down at the envelope map, still crumpled in
her hand. She thought about the creek, the cold stones and
the man who had not minded waiting for her. "Do I need to
know how to get there?" she asked. "Because I think I know
the way now."
"""
P2 = """In the summer of 1941, a Swiss engineer named George de
Mestral came home from a hunting trip in the mountains with
his dog. Both of them were covered in burrs, the prickly
seed cases of the burdock plant. His trousers were full of
them, and they were tangled deep in the dog's fur.

Most people would have picked the burrs off and thrown them
away. De Mestral wanted to know why they held on so well. He
put one under a microscope and saw that it was covered with
tiny hooks, each far too small to see without help. The
hooks caught on anything with a loop in it, such as the
threads of his trousers or the hairs of his dog.

The burr was not using glue. It was using its shape. And the
shape had a purpose. A burdock plant cannot walk, so its
seeds need a way to travel to new ground where they have room
to grow. By hooking onto a passing animal, a burr can ride a
long way before it falls off, carrying its seeds with it.

Burdock is not the only plant that sends its seeds traveling.
The seeds of a dandelion float away on the wind under tiny
fluffy tops. The winged seeds of a maple tree spin as they
fall, so the wind can carry them away from the parent tree.
Each plant has its own way of getting its seeds somewhere new.

De Mestral decided to copy the burr. He imagined a fastener
made of two strips of cloth: one covered with thousands of
tiny hooks, and the other covered with thousands of tiny
loops. Making the hooks was the hard part, and it took him
years of experiments. In 1955 he received a United States
patent for his invention. Today we call it Velcro.
"""
PASSAGES = [
 {'id': 'RC-W9-P1', 'title': "Nadia's Map", 'text': P1, 'lines': True, 'form': 'W9',
  'source': 'Original fiction authored for Sheila ISEE'},
 {'id': 'RC-W9-P2', 'title': 'A Seed That Hitched a Ride', 'text': P2, 'lines': True, 'form': 'W9',
  'source': 'Facts checked against the World Intellectual Property Organization, "From a Mountain Walk to 2,100 Patents: The Velcro IP Story" (wipo.int, IP Advantage), for 1941, the hunting trip in the mountains with his dog, burdock burrs on his trousers and the dog\'s fur, burrs as seeds that cling to animals to reach new ground, and the two strips of hooks and loops; Velcro\'s own history page (velcro.com) for the microscope and the tiny hooks catching loops in fabric and fur; and US patent 2,717,437, granted 13 September 1955 to George de Mestral. Dandelion and maple seed travel is general botany (seed dispersal by wind).'},
]

def rc(n, pid, skill, sub, diff, prompt, key, wrong, expl, misc):
    RC.append(make(f'RC-W9-{n:02d}', 'RC', skill, sub, diff, prompt, key, wrong, expl, misc, passage_id=pid))

# Passage 1 — lines are counted by tools/itemspec.passage_lines; checked in __main__.
rc(1, 'RC-W9-P1', 'Supporting detail/evidence', 'supporting detail — cause of an event', 'E',
   'Why did Nadia end up at the creek instead of the library?',
   'She turned at the wrong bakery.',
   {'She was following the man with the net.': 'She met the man only after she reached the creek (line 11).',
    "Her mother's map left out the fire station.": 'The map names the fire station (line 4).',
    'She stopped to look at the insects under the stones.': 'She sees the insects only later, while she waits for the man (lines 17–18).'},
   'Lines 6–7: "She turned left at the first bakery she saw, not knowing that Larkspur had two." The man confirms it in line 13: "Wrong bakery."',
   'picks an event that happens later in the story')
rc(2, 'RC-W9-P1', 'Supporting detail/evidence', 'supporting detail — what a fact shows', 'M',
   'According to the passage, finding the tiny insects under the stones shows that the creek',
   'has clean, healthy water',
   {'is too cold for fish': 'The passage never mentions fish. Lines 18–20 say the insects live only in clean, cold water.',
    'is about to flood the field': 'Nothing in the passage says the creek will flood.',
    'is a good place to catch insects for pets': 'The man counts the insects; nothing says they are kept as pets.'},
   'Lines 18–20: the insects "could live only in clean, cold water, so finding them meant the creek was healthy."',
   'answers from outside knowledge instead of the passage')
rc(3, 'RC-W9-P1', 'Supporting detail/evidence', 'supporting detail — a number in the text', 'E',
   'For how long had the man been counting the insects every Saturday?',
   'eleven years',
   {'five minutes': 'Five minutes is how long he asks Nadia to wait (line 16).',
    'ten minutes': 'Ten minutes is how long Nadia\'s mother said the walk would take (line 5).',
    'twenty minutes': 'Twenty minutes is how long Nadia walked before reaching the creek (lines 7–8).'},
   'Lines 21–22: "he had done it for eleven years."',
   'picks a different number from the passage')
rc(4, 'RC-W9-P1', 'Supporting detail/evidence', 'supporting detail — what a character does', 'E',
   "What does the librarian do with the man's notebook?",
   'She copies its numbers into a binder.',
   {'She puts it on a shelf to lend.': 'Nothing in lines 23–27 says the notebook goes on a shelf.',
    'She gives it to Nadia to read.': 'She hands Nadia nothing; she asks whether Nadia is new.',
    'She sends it to the town newspaper.': 'The passage never mentions a newspaper.'},
   'Lines 24–25: "She copied the numbers into a binder labeled \'Larkspur Creek Watch.\'"',
   'adds something the passage never says')
rc(5, 'RC-W9-P1', 'Inference', 'inference — what a remark shows', 'M',
   'When the man says "Everyone does that the first week" (line 14), he is mainly showing that',
   "Nadia's mistake is a common one",
   {'he gets lost on the way to the library too': 'He knows exactly where the library is and offers to walk her there (lines 15–16).',
    'the town should take down one of its bakeries': 'He laughs at the mix-up; he does not ask for anything to change.',
    'new people should never use maps': 'He studies her map; he is not against maps. He says the mistake is the usual one.'},
   'He laughs and says "Everyone does that," which tells Nadia that lots of newcomers make the same mistake, so she should not feel bad.',
   'takes a friendly remark as a complaint or a rule')
rc(6, 'RC-W9-P1', 'Main idea', 'main idea — the whole passage', 'M',
   'Which sentence best states the main idea of the passage?',
   'Getting lost helps Nadia find a place in her new town.',
   {'A map drawn on an envelope can never be trusted in a new town.': 'The map was right; the town just had two bakeries. And the story is about more than the map.',
    "Larkspur's library is hard to find.": 'This is one detail at the start. The story goes on to the creek, the man and the volunteers.',
    'Some insects can live only in cold water.': 'This is a detail from the fourth paragraph, not what the whole story is about.'},
   'Nadia gets lost, meets the man, learns about the creek count and is invited to volunteer. By the end she "knows the way" to a place in her new town.',
   'picks one detail instead of the whole story')
rc(7, 'RC-W9-P1', 'Organization/logic', 'organization — the job of a paragraph', 'M',
   'The fourth paragraph (lines 17–22) mainly',
   'explains what the man is doing at the creek',
   {'describes the walk to the library': 'The walk to the library is not described; the next paragraph begins at the library.',
    "tells why Nadia's family moved": 'The passage never says why the family moved.',
    'shows that Nadia is angry at her mother for drawing a bad map': 'Nadia is never described as angry, and the map was not wrong.'},
   'Lines 17–22 tell what the man is catching, why it matters, and how long he has done it.',
   'mixes up which paragraph says what')
rc(8, 'RC-W9-P1', 'Inference', 'inference — the meaning of an ending', 'H',
   'At the end of the passage, when Nadia says "I think I know the way now," she most likely means that she',
   'can find the creek again to help with the count',
   {'will never use her mother\'s map again': 'She is not giving up maps. She means she knows the way to the creek.',
    'wants to go home right away': 'She is answering the librarian\'s question about volunteering, not asking to leave.',
    'has learned where both bakeries are': 'She does not mention the bakeries; she has just been asked about counting at the creek.'},
   'The librarian asks for volunteers to count on Saturdays. Nadia asks whether she needs to know how to get there and says she already knows the way, which shows she wants to help at the creek.',
   'takes the words too literally')

# Passage 2
rc(9, 'RC-W9-P2', 'Supporting detail/evidence', 'supporting detail — what was observed', 'E',
   'What did de Mestral see when he looked at a burr under a microscope?',
   'tiny hooks',
   {'a sticky glue': 'Line 12 says the burr was not using glue.',
    'soft loops': 'Loops are what the hooks caught on, such as the threads of his trousers (lines 10–11).',
    'tiny seeds with wings': 'Winged seeds belong to the maple tree (lines 19–20), not the burr.'},
   'Lines 8–9: he "saw that it was covered with tiny hooks."',
   'mixes up the hooks with the loops they catch')
rc(10, 'RC-W9-P2', 'Supporting detail/evidence', 'supporting detail — a reason', 'M',
   'According to the third paragraph, why does a burr hook onto animals?',
   'to spread its seeds',
   {'to keep the animal warm': 'Nothing in the passage says burrs keep animals warm.',
    'to protect itself from the wind': 'The wind is how dandelion and maple seeds travel (lines 18–20), not a danger to the burr.',
    'to get food from the animal': 'The passage never says burrs feed on animals.'},
   'Lines 13–16: the plant cannot walk, so its seeds need a way to travel to new ground, and riding on an animal carries them there.',
   'answers from guesswork instead of the paragraph')
rc(11, 'RC-W9-P2', 'Supporting detail/evidence', 'supporting detail — comparing examples', 'M',
   'How are dandelion seeds and maple seeds alike, according to the passage?',
   'Both travel by wind.',
   {'Both have tiny hooks.': 'Hooks belong to the burdock burr (line 9), not to the dandelion or the maple.',
    'Both cling to animal fur.': 'Clinging to fur is how the burr travels (lines 15–16).',
    'Both grow only near water.': 'The passage never says where they grow.'},
   'Lines 18–20: dandelion seeds "float away on the wind," and maple seeds spin "so the wind can carry them away."',
   'applies a detail about one plant to another')
rc(12, 'RC-W9-P2', 'Supporting detail/evidence', 'supporting detail — a date', 'E',
   'In what year did de Mestral receive a United States patent for his invention?',
   '1955',
   {'1941': '1941 is the year of the hunting trip (line 1), when the idea began.',
    '1948': 'The passage gives no event in 1948.',
    '2001': 'The passage gives no event in 2001.'},
   'Lines 26–27: "In 1955 he received a United States patent for his invention."',
   'picks the other date in the passage')
rc(13, 'RC-W9-P2', 'Main idea', 'main idea — the whole passage', 'M',
   'Which sentence best states the main idea of the passage?',
   'A traveling seed gave an engineer an idea.',
   {'Dandelions and maples spread their seeds by wind.': 'That is one paragraph, an example beside the main story about the burr.',
    'Dogs often come home covered in burrs after a walk.': 'This is how the story starts, not what it is mainly about.',
    'Inventors always need many years to make a product.': 'The passage says the hooks took years, but it does not say this is always true.'},
   'The passage moves from the burrs on the dog, to how a burr works and why, to the fastener de Mestral copied from it.',
   'picks an opening detail or a side example')
rc(14, 'RC-W9-P2', 'Organization/logic', 'organization — why a paragraph is included', 'H',
   'Why does the author include the fourth paragraph (lines 17–21)?',
   'to give more examples of traveling seeds',
   {'to explain how Velcro is made': 'How Velcro is made comes in the last paragraph.',
    'to describe what de Mestral saw under the microscope': 'That is in the second paragraph (lines 6–11).',
    'to tell how de Mestral got his patent': 'The patent is in the last paragraph (lines 26–27).'},
   'The paragraph begins "Burdock is not the only plant that sends its seeds traveling" and gives two more examples.',
   'mixes up which paragraph does which job')
rc(15, 'RC-W9-P2', 'Supporting detail/evidence', 'supporting detail — what was hard', 'M',
   'According to the passage, what was the hardest part of making the fastener?',
   'making the hooks',
   {'finding a dog': 'The dog is part of how the idea started, not part of making the fastener.',
    'making the loops': 'The passage says the hooks were the hard part (line 25), not the loops.',
    'naming the product': 'The passage never says naming it was hard.'},
   'Lines 25–26: "Making the hooks was the hard part, and it took him years of experiments."',
   'swaps the hooks and the loops')
rc(16, 'RC-W9-P2', 'Inference', 'inference — what a detail suggests about a person', 'M',
   'The second paragraph suggests that de Mestral was',
   'curious about how things work',
   {'annoyed by his dog': 'He does not blame the dog; he studies the burrs instead.',
    'careless with his clothes': 'The burrs got on him on a hunting trip; nothing suggests carelessness.',
    'in a hurry': 'He takes the time to study a burr under a microscope (lines 7–9).'},
   'Lines 6–7: "Most people would have picked the burrs off and thrown them away. De Mestral wanted to know why they held on so well."',
   'picks what most people did instead of what he did')

# ================================================================ precision words and essay
PRECISION_W9 = {
 'title': 'SESSION 1 — PRECISION REVIEW • 20–25 min',
 'minutes': '20–25 min',
 'words': [{'n': i, 'word': w, 'task': 'Explain in your own words + use it in a sentence of your own.', 'pos': pos,
            'meaning': meaning, 'example': ex, 'usage': usage, 'connotation': conn}
           for i, (w, pos, meaning, ex, usage, conn) in enumerate(WORDS, 1)],
}
ESSAY_W9 = {
 'prompt': 'Describe something that was hard for you at first but became easier with practice. What helped you keep going?',
 'focus': 'Full timed rehearsal • a clear ending • checking the draft against the prompt',
 'alternate': 'PR-2 — Personal reflection',
}

def write(path, bank, items):
    json.dump({'bank': bank, 'schema_version': '1.0', 'content_version': VER, 'items': items},
              open(path, 'w'), indent=1, ensure_ascii=False)
    open(path, 'a').write('\n')
    print(f'{path}: {len(items)} items, keys {"".join(i["correct"] for i in items) if items and "correct" in items[0] else ""}')

def check_citations():
    """Each passage's word count, and every line range an item cites must exist."""
    from itemspec import passage_lines
    for p in PASSAGES:
        n = len(passage_lines(p['text'])); w = len(p['text'].split())
        assert 300 <= w <= 600, (p['id'], w)
        for it in RC:
            if it['passage_id'] != p['id']: continue
            text = ' '.join([it['prompt'], it['explanation'], *it['why'].values()])
            for a, b in re.findall(r'lines? (\d+)(?:–(\d+))?', text):
                assert 1 <= int(a) <= int(b or a) <= n, (it['id'], a, b, n)
        print(f"  {p['id']}: {w} words, {n} lines")

if __name__ == '__main__':
    assert len(MA) == 48 and len(QR) == 24 and len(VR) == 36 and len(RC) == 16
    write('content/question-banks/ma-w9.json', 'ma-w9', MA)
    write('content/question-banks/qr-w9.json', 'qr-w9', QR)
    write('content/question-banks/vr-w9.json', 'vr-w9', VR)
    write('content/question-banks/rc-w9.json', 'rc-w9', RC)
    write('content/passages/rc-w9-passages.json', 'rc-w9-passages',
          [{**p, 'schema_version': '1.0', 'content_version': VER} for p in PASSAGES])
    check_citations()
    pr = json.load(open('content/precision.json')); pr['W9'] = PRECISION_W9
    json.dump(pr, open('content/precision.json', 'w'), ensure_ascii=False, indent=1)
    es = json.load(open('content/essay.json'))
    w8 = es['weeks']['W8']
    es['weeks']['W9'] = {**ESSAY_W9, **{k: w8[k] for k in ('target', 'plan_fields', 'draft_fields', 'feedback_checks')}}
    json.dump(es, open('content/essay.json', 'w'), ensure_ascii=False, indent=1)
