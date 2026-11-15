#!/usr/bin/env python3
"""Author the W8 number-sense layer: content/question-banks/ma-numbers-plus.json.

Why this exists (15 November 2026): the real ISEE score report for the 24 October
sitting came back. Mathematics Achievement was her lowest section (868, 72nd
percentile, stanine 6; VR 7, RC 8, QR 8), and five of the seven scored MA questions
she missed were in two strands: Whole Numbers (2 of 4 right) and Decimals, Percents,
Fractions (3 of 6 right). Geometry, Algebraic Concepts, Measurement and Data Analysis
lost one question between them. An online practice paper the next day showed the same
thing: of her three MA misses, two were number questions (which of 2/3, 3/4, 4/5, 5/6
is largest; which fraction equals 0.650, where she chose 100/650).

So the figure-reading layer added on 14 November, which was aimed at her Mock 1 misses,
is not where the real test found her short. This layer gives W8 two more MA sittings
aimed at the two weak strands: comparing fractions, moving between decimals, fractions
and percents, decimal place value, fraction arithmetic, whole-number place value,
rounding, estimation and multi-step whole-number problems.

It follows the same rules as tools/author_figures_w8.py: each item is written as
(choices, the right one, why each wrong one is wrong). The script puts the choices in
the official order (numbers ascending), works out the letters, asserts every
arithmetic key against a computation, and hashes.
"""
import json, os, sys
from fractions import Fraction as F
sys.path.insert(0, os.path.dirname(__file__))
from itemspec import num, kind_of, in_official_order, content_hash

VER = '2026.11.15'
SRC = 'Original content authored for Sheila ISEE'

def order(vals):
    k = kind_of(vals)
    if k == 'number': return sorted(vals, key=num)
    if k == 'word': return sorted(vals, key=str.lower)
    return sorted(vals, key=len)

MA = []
def ma(n, skill, sub, diff, prompt, key, wrong, expl, misc, value=None):
    vals = order([key] + list(wrong))
    assert len(set(vals)) == 4, n
    assert in_official_order(vals), (n, vals)
    # For a numeric item, the key's value must be the one the computation gave,
    # and no wrong choice may share it.
    if value is not None:
        assert num(key) == value, (n, key, value)
        assert all(num(w) != value for w in wrong), (n, 'a wrong choice equals the key')
    L = 'ABCD'
    it = {'id': f'MA-W8-N-{n:02d}', 'subject': 'MA', 'form': 'W8', 'skill': skill, 'subskill': sub,
          'difficulty': diff, 'prompt': prompt,
          'choices': {L[i]: v for i, v in enumerate(vals)}, 'correct': L[vals.index(key)],
          'explanation': expl, 'misconceptions': misc,
          'why': {L[vals.index(w)]: t for w, t in wrong.items()},
          'source': SRC, 'schema_version': '1.0', 'content_version': VER}
    it['content_hash'] = content_hash(it)
    MA.append(it)

# ------------------------------------------------------------ comparing fractions
fr = [F(7, 8), F(4, 5), F(9, 10), F(5, 6)]
assert min(fr) == F(4, 5)
ma(1, 'Fractions', 'comparing fractions one piece short of 1', 'M',
   'Which fraction is the smallest?',
   '4/5', {'5/6': '5/6 is 1/6 short of a whole, and 1/6 is a smaller piece than 1/5, so 5/6 is closer to 1 than 4/5 is.',
           '7/8': '7/8 is only 1/8 short of a whole, so it is closer to 1, and bigger, than 4/5.',
           '9/10': '9/10 has the biggest numbers, but it is just 1/10 short of a whole: it is the largest of the four, not the smallest.'},
   'Each fraction is one piece short of 1 whole: 4/5 is missing 1/5, 5/6 is missing 1/6, 7/8 is missing 1/8 and 9/10 is missing 1/10. Fifths are the biggest pieces, so 4/5 is missing the most and is the smallest.',
   'thinks bigger numbers on top and bottom make a bigger fraction, or the reverse', F(4, 5))

assert F(3, 8) < F(1, 2) and all(f > F(1, 2) for f in [F(6, 11), F(5, 9), F(4, 7)])
ma(2, 'Fractions', 'comparing a fraction with one half', 'E',
   'Which fraction is less than 1/2?',
   '3/8', {'6/11': '6/11 is more than 1/2: half of 11 is 5 1/2, and 6 is more than that.',
           '5/9': '5/9 is more than 1/2: half of 9 is 4 1/2, and 5 is more than that.',
           '4/7': '4/7 is more than 1/2: half of 7 is 3 1/2, and 4 is more than that.'},
   'A fraction is less than 1/2 when its top number is less than half of its bottom number. Half of 8 is 4, and 3 is less than 4, so 3/8 is less than 1/2.',
   'compares only the top numbers or only the bottom numbers', F(3, 8))

assert F(1, 3) < F(2, 5) < F(1, 2) and F(1, 4) < F(1, 3) and F(3, 5) > F(1, 2) and F(5, 8) > F(1, 2)
ma(3, 'Fractions', 'a fraction between two benchmarks', 'M',
   'Which fraction is greater than 1/3 but less than 1/2?',
   '2/5', {'1/4': 'Fourths are smaller pieces than thirds, so 1/4 is less than 1/3.',
           '3/5': '3/5 is more than 1/2: half of 5 is 2 1/2, and 3 is more than that.',
           '5/8': '5/8 is more than 1/2: half of 8 is 4, and 5 is more than 4.'},
   'Check each side. Less than 1/2: half of 5 is 2 1/2, and 2 is less, so 2/5 is under 1/2. More than 1/3: with the same bottom number, 2/5 = 6/15 and 1/3 = 5/15, and 6/15 is more.',
   'checks only one side of "between"', F(2, 5))

eaten = {'Ana': F(2, 3), 'Leo': F(5, 8), 'Mia': F(3, 4), 'Sam': F(7, 12)}
assert max(eaten, key=eaten.get) == 'Mia'
ma(4, 'Fractions', 'comparing fractions with different denominators in a story', 'M',
   'Four friends each had a pizza of the same size. Ana ate 2/3 of hers, Leo ate 5/8 of his, Mia ate 3/4 of hers, and Sam ate 7/12 of his. Who ate the most pizza?',
   'Mia', {'Ana': 'Ana ate 2/3, which is 8/12. Mia ate 3/4, which is 9/12, so Mia ate more.',
           'Leo': 'Leo ate 5/8, which is 0.625. Mia ate 3/4, which is 0.75, so Mia ate more.',
           'Sam': 'Sam ate 7/12. Mia ate 3/4, which is 9/12, so Mia ate more.'},
   'Change each amount to a decimal (or to 24ths): 2/3 is about 0.67, 5/8 is 0.625, 3/4 is 0.75 and 7/12 is about 0.58. 3/4 is the largest, so Mia ate the most.',
   'picks the fraction with the biggest numbers instead of the biggest value')

# ------------------------------------------------------------ decimals and fractions
assert F('0.45') == F(9, 20)
ma(5, 'Decimals', 'writing a decimal as a fraction', 'M',
   'Which fraction is equal to 0.45?',
   '9/20', {'45/1000': '45/1000 is 0.045. The 5 in 0.45 is in the hundredths place, so 0.45 is 45/100.',
            '4/5': '4/5 is 0.8. It reads the 4 and the 5 of 0.45 as a top and a bottom number.',
            '9/2': '9/2 is 4 1/2, which is 4.5, ten times too big: 0.45 is 9/20, not 9/2.'},
   '0.45 is 45 hundredths, or 45/100. Divide the top and bottom by 5: 45 ÷ 5 = 9 and 100 ÷ 5 = 20, so 0.45 = 9/20.',
   'uses the wrong place value; reads the digits as a fraction', F(9, 20))

assert F('0.375') == F(3, 8)
ma(6, 'Decimals', 'writing a three-place decimal as a fraction', 'H',
   'Which fraction is equal to 0.375?',
   '3/8', {'3/5': '3/5 is 0.6. It uses only the first digit, 3, and guesses the bottom number.',
           '3/4': '3/4 is 0.75, twice as much as 0.375. 0.375 is half of 0.75, so it is half of 3/4.',
           '375/100': '375/100 is 3.75. 0.375 has three digits after the point, so it is thousandths: 375/1000.'},
   'Know that 1/8 = 0.125 (half of 1/4, which is 0.25). Then 3/8 = 3 × 0.125 = 0.375. Another way: 0.375 is 375/1000, and dividing the top and bottom by 125 gives 3/8.',
   'counts the decimal places wrong', F(3, 8))

assert F(3, 5) == F('0.6')
ma(7, 'Decimals', 'writing a fraction as a decimal', 'E',
   'Which decimal is equal to 3/5?',
   '0.6', {'0.06': '0.06 is 6 hundredths. 3/5 is 6 tenths: 0.6.',
           '0.35': '0.35 writes the 3 and the 5 side by side. A fraction bar means divide, not "put the digits together".',
           '0.53': '0.53 writes the digits backwards. 3/5 means 3 ÷ 5.'},
   'Make the bottom number 10: 3/5 = 6/10, and 6 tenths is 0.6.',
   'writes the top and bottom digits as a decimal', F(3, 5))

assert F(7, 25) == F('0.28')
ma(8, 'Decimals', 'writing a fraction as a decimal by making 100', 'M',
   'Which decimal is equal to 7/25?',
   '0.28', {'0.07': '0.07 uses only the top number, 7. The bottom number is 25, not 100.',
            '0.725': '0.725 writes the 7 and the 25 side by side. A fraction bar means divide.',
            '3.57': '3.57 is about 25 ÷ 7, the division the wrong way round. 7/25 is less than 1.'},
   'Multiply the top and bottom by 4 to make hundredths: 7 × 4 = 28 and 25 × 4 = 100, so 7/25 = 28/100 = 0.28.',
   'writes the digits side by side; divides the wrong way', F(7, 25))

assert F('0.6') < F('0.65') < F('0.7') and F('0.705') > F('0.7')
ma(9, 'Decimals', 'a decimal between two tenths', 'M',
   'Which number is greater than 0.6 and less than 0.7?',
   '0.65', {'0.705': '0.705 is a little more than 0.7, because 0.7 is the same as 0.700.',
            '0.76': '0.76 is more than 0.7, because 0.7 is the same as 0.70.',
            '6.5': '6.5 is six and a half, far more than 0.7. The point is in the wrong place.'},
   'Write all the numbers with the same number of places: 0.60, 0.65, 0.70. 0.65 is between 0.60 and 0.70.',
   'thinks more digits means a smaller number', F('0.65'))

vals = [F('0.3'), F('0.25'), F('0.209'), F('0.31')]
assert min(vals) == F('0.209')
ma(10, 'Decimals', 'comparing decimals with different numbers of places', 'M',
   'Which number is the least?',
   '0.209', {'0.25': '0.25 is 0.250, which is more than 0.209: compare the tenths first, then the hundredths.',
             '0.3': '0.3 is 0.300. It has the fewest digits, but 3 tenths is more than 2 tenths.',
             '0.31': '0.31 is 0.310, more than 0.209 and more than 0.3.'},
   'Give every number three places, smallest first: 0.209, 0.250, 0.300, 0.310. Compare the tenths first: 0.250 and 0.209 have 2 tenths, the others 3. Then the hundredths: 0 is less than 5, so 0.209 is the least.',
   'thinks the number with fewer digits is smaller', F('0.209'))

# ------------------------------------------------------------ percents
assert F(40, 100) == F(2, 5)
ma(11, 'Percent', 'writing a percent as a fraction', 'E',
   'Which fraction is equal to 40%?',
   '2/5', {'1/40': '1/40 is 2.5%. It puts the 40 on the bottom.',
           '4/100': '4/100 is 4%. 40% means 40 out of 100: 40/100.',
           '4/5': '4/5 is 80%, twice as much as 40%.'},
   'Percent means "out of 100", so 40% = 40/100. Divide the top and bottom by 20: 40/100 = 2/5.',
   'misreads "percent" as a place value', F(2, 5))

assert F(25, 100) * 36 == 9
ma(12, 'Percent', 'percent of a number', 'E',
   'What is 25% of 36?',
   '9', {'11': '11 takes 25 away from 36. 25% means one quarter of 36, not 25 less.',
         '12': '12 comes from 36 ÷ 3, which finds a third. 25% is a quarter, so divide by 4.',
         '25': '25 copies the percent. 25% of 36 is a part of 36, found by dividing 36 into 4 equal parts.'},
   '25% is one quarter. 36 ÷ 4 = 9.',
   'subtracts the percent; uses the wrong fraction', 9)

assert 40 - F(25, 100) * 40 == 30
ma(13, 'Percent', 'price after a percent discount', 'M',
   'A jacket costs $40. It is on sale for 25% off. What is the sale price?',
   '$30', {'$10': '$10 is the amount taken off (25% of $40). The question asks what the jacket costs after that.',
           '$15': '$15 takes 25 dollars off. 25% off means a quarter of the price comes off, and a quarter of $40 is $10.',
           '$50': '$50 adds the $10. "Off" means take it away.'},
   '25% is one quarter. A quarter of $40 is $40 ÷ 4 = $10. The sale price is $40 − $10 = $30.',
   'stops at the discount; takes off dollars instead of a percent', 30)

assert F(12, 20) == F(60, 100)
ma(14, 'Percent', 'writing a part of a group as a percent', 'M',
   'There are 20 students in a class, and 12 of them have a pet. What percent of the students have a pet?',
   '60%', {'12%': '12% uses the count of students, 12, as if the class had 100 students. It has 20.',
           '20%': '20% uses the size of the class. The question asks what part of the 20 have a pet.',
           '40%': '40% is the part without a pet (8 of 20). The question asks about the students who have one.'},
   '12 out of 20 is 12/20. Multiply the top and bottom by 5 to get hundredths: 60/100 = 60%.',
   'uses a count as a percent; finds the other part', 60)

# ------------------------------------------------------------ whole numbers
assert (7482036 // 100000) % 10 == 4
ma(15, 'Whole-number operations', 'value of a digit', 'E',
   'What is the value of the digit 4 in 7,482,036?',
   '400,000', {'4': '4 is the digit itself. The question asks what it is worth where it sits.',
               '4,000': '4,000 is two places too small. Count the places from the right: ones, tens, hundreds, thousands, ten thousands, hundred thousands.',
               '40,000': '40,000 is one place too small. The 4 is in the hundred thousands place.'},
   'In 7,482,036 the 7 is in the millions place and the 4 is in the hundred thousands place, so the 4 is worth 400,000.',
   'gives the digit, not its value; miscounts the places', 400000)

assert round(46751, -3) == 47000
ma(16, 'Whole-number operations', 'rounding to the nearest thousand', 'E',
   'What is 46,751 rounded to the nearest thousand?',
   '47,000', {'46,000': '46,000 rounds down, but the hundreds digit is 7, which is 5 or more, so round up.',
              '46,700': '46,700 cuts off the last two digits; it is not rounded to a thousand at all.',
              '46,800': '46,800 is 46,751 rounded to the nearest hundred, not the nearest thousand.'},
   'Look at the digit one place to the right of the thousands: the hundreds digit, 7. It is 5 or more, so the 6 thousands goes up to 7: 47,000.',
   'rounds to the wrong place; rounds down when it should round up', 47000)

assert 6 * 144 - 395 == 469
ma(17, 'Whole-number operations', 'multi-step problem with regrouping', 'M',
   'A school bought 6 boxes of pencils with 144 pencils in each box. It gave out 395 pencils. How many pencils are left?',
   '469', {'325': '325 uses 5 boxes (5 × 144 = 720). The school bought 6 boxes, 864 pencils.',
           '579': '579 regroups but never takes away what it borrowed: after lending, the 6 tens become 5 and the 8 hundreds become 7.',
           '1,259': '1,259 adds the 395 pencils. They were given out, so take them away.'},
   '6 × 144 = 864 pencils. Then 864 − 395: 14 − 5 = 9 ones, 15 − 9 = 6 tens after regrouping, and 7 − 3 = 4 hundreds. 469 pencils are left.',
   'loses a regrouped digit; adds instead of subtracting', 469)

assert -(-92 // 8) == 12 and 92 % 8 == 4
ma(18, 'Division', 'what a remainder means in a story', 'M',
   'Ninety-two students are going on a trip. Each van holds 8 students. What is the least number of vans needed?',
   '12', {'4': '4 is the remainder: 92 = 11 × 8 + 4. Those 4 students still need a van.',
          '11': '11 vans hold 88 students, so 4 students would be left behind. They need one more van.',
          '100': '100 adds 92 and 8. Sharing students into vans is division.'},
   '92 ÷ 8 = 11 with 4 left over. Eleven vans hold 88 students, and the other 4 need a twelfth van, so 12 vans.',
   'drops the remainder instead of adding one more group', 12)

assert 48 % 6 == 0 and 48 % 8 == 0 and 32 % 6 and 36 % 8 and 14 % 6
ma(19, 'Number properties', 'common multiples', 'M',
   'Which number is a multiple of both 6 and 8?',
   '48', {'14': '14 is 6 + 8. A multiple of 6 is in the 6 times table, and 14 is not.',
          '32': '32 is a multiple of 8 (4 × 8) but not of 6.',
          '36': '36 is a multiple of 6 (6 × 6) but not of 8.'},
   'Count by 8s and check each for 6: 8, 16, 24 — 24 is 6 × 4. The multiples of both are 24, 48, 72 … and 48 = 6 × 8.',
   'adds the numbers; checks only one of them', 48)

assert 400 * 50 == 20000
ma(20, 'Whole-number operations', 'estimating a product', 'M',
   'Which is the best estimate of 412 × 49?',
   '20,000', {'2,000': '2,000 drops a zero: 400 × 50 has three zeros in all.',
              '25,000': '25,000 rounds 412 up to 500, but 412 is much closer to 400.',
              '200,000': '200,000 adds an extra zero: 4 × 5 = 20, then 400 × 50 = 20 with three zeros.'},
   'Round each number to one it is close to: 412 is about 400 and 49 is about 50. 400 × 50 = 20,000.',
   'loses or adds a zero; rounds to a far number', 20000)

# ------------------------------------------------------------ fraction and decimal arithmetic
assert F(3, 4) * 28 == 21
ma(21, 'Fractions', 'fraction of a whole number', 'E',
   'What is 3/4 of 28?',
   '21', {'7': '7 comes from 28 ÷ 4, just one quarter. 3/4 is three of those quarters: 3 × 7.',
          '14': '14 comes from 28 ÷ 2, a half. 3/4 is more than a half.',
          '112': '112 is 28 × 4. Finding 3/4 of a number makes it smaller.'},
   'Split 28 into 4 equal parts: 28 ÷ 4 = 7. Three of those parts are 3 × 7 = 21.',
   'stops at one part; multiplies by the bottom number', 21)

assert F(2, 3) + F(1, 6) == F(5, 6)
ma(22, 'Fractions', 'adding fractions with different denominators', 'M',
   'What is 2/3 + 1/6?',
   '5/6', {'3/18': '3/18 adds the top numbers and multiplies the bottom ones. Make the bottom numbers the same first.',
           '3/9': '3/9 adds the top numbers and the bottom numbers. Only the top numbers are added, once the bottoms match.',
           '1/2': '1/2 is 2/3 − 1/6, a subtraction. The question adds.'},
   'Make sixths: 2/3 = 4/6. Then 4/6 + 1/6 = 5/6.',
   'adds tops and bottoms; subtracts', F(5, 6))

assert 2 + F(3, 5) == F(13, 5)
ma(23, 'Fractions', 'mixed number to improper fraction', 'M',
   'Which fraction is equal to 2 3/5?',
   '13/5', {'11/5': '11/5 multiplies 2 × 3 and adds 5. Multiply the whole number by the bottom number: 2 × 5 = 10, then add 3.',
            '23/5': '23/5 writes the 2 and 3 side by side. 2 wholes are 10 fifths, not 20.',
            '30/5': '30/5 multiplies all three numbers. 30/5 is 6, much more than 2 3/5.'},
   'Each whole is 5 fifths, so 2 wholes are 10 fifths. Add the 3 fifths: 10 + 3 = 13. 2 3/5 = 13/5.',
   'multiplies the wrong numbers; writes digits side by side', F(13, 5))

assert F('3.6') + F('0.45') == F('4.05')
ma(24, 'Decimals', 'adding decimals by lining up the points', 'M',
   'What is 3.6 + 0.45?',
   '4.05', {'0.81': '0.81 lines up the last digits (36 + 45) instead of the decimal points.',
            '3.65': '3.65 adds only the 5 hundredths and forgets the 4 tenths.',
            '8.1': '8.1 lines up the first digits (3.6 + 4.5). The 4 in 0.45 is 4 tenths, so it goes under the 6.'},
   'Line up the decimal points and write 3.6 as 3.60. Then 3.60 + 0.45 = 4.05.',
   'lines up digits instead of decimal points', F('4.05'))

def write(bank, items):
    path = f'content/question-banks/{bank}.json'
    json.dump({'bank': bank, 'schema_version': '1.0', 'content_version': VER, 'items': items},
              open(path, 'w'), indent=1, ensure_ascii=False)
    open(path, 'a').write('\n')
    print(f'{path}: {len(items)} items, keys {"".join(i["correct"] for i in items)}')

if __name__ == '__main__':
    assert len(MA) == 24 and len({i['id'] for i in MA}) == 24
    write('ma-numbers-plus', MA)
