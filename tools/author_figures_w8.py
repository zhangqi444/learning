#!/usr/bin/env python3
"""Author the W8 figure-reading layer: content/question-banks/{ma,qr}-figures-plus.json.

Why this exists (14 November 2026): on Mock 1 (28 October) every one of her eight
Mathematics Achievement misses was a question read off a figure — a table, a number
line, a pictograph, a bar graph, a block of cubes, a shape's symmetry, a quadrilateral
on a grid — and she answered all thirteen questions without one. Five of her six QR
misses were figure questions too. The real paper reads about half its QR and four in
ten of its MA off a picture (docs/isee-item-spec.md), so this layer gives W8 two
sittings a subject of nothing but that skill, aimed at the exact figure types she missed.

Each item is written as (choices, the right one, why-each-wrong-one-is-wrong); this
script puts the choices in the official order (numbers ascending, words alphabetical,
phrases by length — tools/itemspec.py), works out the letters, and hashes. Keys that
are arithmetic are asserted here against a computation, so a slip fails the script
rather than reaching her.
"""
import json, os, re, sys
from fractions import Fraction
sys.path.insert(0, os.path.dirname(__file__))
from itemspec import num, kind_of, in_official_order, content_hash, figure_errors

VER = '2026.11.14'
SRC = 'Original content authored for Sheila ISEE'

def order(vals):
    k = kind_of(vals)
    if k == 'number': return sorted(vals, key=num)
    if k == 'word': return sorted(vals, key=str.lower)
    if k == 'phrase': return sorted(vals, key=len)
    # Outside the convention's reach, still never key-first: a chance "x out of y" by its
    # value, a coordinate pair by across then up, anything else shortest first.
    if all(re.fullmatch(r'\d+ out of \d+', v) for v in vals):
        return sorted(vals, key=lambda v: Fraction(*map(int, v.split(' out of '))))
    if all(re.fullmatch(r'\(\d+, \d+\)', v) for v in vals):
        return sorted(vals, key=lambda v: tuple(map(int, re.findall(r'\d+', v))))
    return sorted(vals, key=lambda v: (len(v), v))

def item(id_, subj, skill, sub, diff, prompt, fig, key, wrong, expl, misc):
    vals = order([key] + list(wrong))
    assert len(set(vals)) == 4, id_
    assert in_official_order(vals), (id_, vals)
    L = 'ABCD'
    ch = {L[i]: v for i, v in enumerate(vals)}
    corr = L[vals.index(key)]
    it = {'id': id_, 'subject': subj, 'form': 'W8', 'skill': skill, 'subskill': sub,
          'difficulty': diff, 'prompt': prompt, 'figure': fig, 'choices': ch, 'correct': corr,
          'explanation': expl, 'misconceptions': misc,
          'why': {L[vals.index(w)]: t for w, t in wrong.items()},
          'source': SRC, 'schema_version': '1.0', 'content_version': VER}
    errs = figure_errors(it)
    assert not errs, errs
    it['content_hash'] = content_hash(it)
    return it

MA = []; QR = []
def ma(n, *a): MA.append(item(f'MA-W8-F-{n:02d}', 'MA', *a))
def qr(n, *a): QR.append(item(f'QR-W8-F-{n:02d}', 'QR', *a))

# ------------------------------------------------------------------ Mathematics Achievement
assert 148 + 265 + 197 == 610
ma(1, 'Whole-number operations', 'adding numbers read from a table', 'E',
   'The table shows how many cans each class collected for the food drive. How many cans did the three classes collect in all?',
   {'type': 'table', 'head': ['Class', 'Cans collected'], 'rows': [['Room 4', '148'], ['Room 7', '265'], ['Room 9', '197']]},
   '610', {'410': '410 drops the 2 hundreds carried from the tens column (4 + 6 + 9 + 2 = 21 tens): carry it into the hundreds.',
           '413': '413 adds only Room 4 and Room 7 (148 + 265); the question asks for all three classes.',
           '590': '590 forgets the 2 tens carried from the ones column (8 + 5 + 7 = 20 ones).'},
   'Add all three rows: 148 + 265 + 197. Ones: 8 + 5 + 7 = 20, write 0 and carry 2. Tens: 4 + 6 + 9 + 2 = 21, write 1 and carry 2. Hundreds: 1 + 2 + 1 + 2 = 6. The total is 610.',
   'adds only two rows; drops a carried digit')

assert 31 - 18 == 13
ma(2, 'Data', 'difference between the greatest and least value in a table', 'E',
   'The table shows the heights of four trees in a park. How much taller is the tallest tree than the shortest tree?',
   {'type': 'table', 'head': ['Tree', 'Height (feet)'], 'rows': [['Maple', '23'], ['Oak', '31'], ['Pine', '18'], ['Elm', '26']]},
   '13 feet', {'5 feet': '5 feet compares the tallest tree with the next tallest (31 − 26), not with the shortest.',
               '8 feet': '8 feet compares the Elm with the Pine (26 − 18); the tallest tree is the Oak, 31 feet.',
               '49 feet': '49 feet adds the two heights (31 + 18); "how much taller" asks for the difference.'},
   'The tallest tree is the Oak, 31 feet, and the shortest is the Pine, 18 feet. 31 − 18 = 13 feet.',
   'picks the wrong pair of rows; adds instead of subtracting')

ma(3, 'Fractions', 'reading a mixed number on a number line', 'M',
   'Use the number line to answer the question. What number does point P show?',
   {'type': 'numberline', 'min': 2, 'max': 3, 'step': 0.25, 'labelEvery': 4, 'points': [{'at': 2.75, 'label': 'P'}]},
   '2 3/4', {'2 1/4': '2 1/4 counts the spaces back from 3 instead of forward from 2: P is three spaces past 2.',
             '2 1/3': '2 1/3 sees three tick marks between 2 and 3 and calls them thirds; there are four equal spaces, so each is a fourth.',
             '3 3/4': '3 3/4 has the right fraction on the wrong whole number: P is between 2 and 3, so it is 2 and some fourths.'},
   'Between 2 and 3 the line is cut into 4 equal spaces, so each space is 1/4. P is 3 spaces past 2, so P is 2 3/4. Count the spaces, not the tick marks.',
   'counts tick marks instead of spaces; counts from the wrong end')

ma(4, 'Decimals', 'distance between two points on a decimal number line', 'H',
   'Use the number line to answer the question. What is the distance between point K and point L?',
   {'type': 'numberline', 'min': 1, 'max': 2, 'step': 0.1, 'labelEvery': 5, 'points': [{'at': 1.2, 'label': 'K'}, {'at': 1.7, 'label': 'L'}]},
   '0.5', {'0.4': '0.4 counts the tick marks between K and L (there are 4); the distance is the spaces between them, and there are 5.',
           '2.9': '2.9 adds the two numbers (1.2 + 1.7); a distance is how far apart they are, so subtract.',
           '5': '5 counts the spaces correctly but forgets that each space is one tenth: 5 tenths is 0.5.'},
   'Each small space is 0.1, because 1 to 1.5 is cut into 5 spaces. K is at 1.2 and L is at 1.7. 1.7 − 1.2 = 0.5, which is 5 spaces of one tenth each.',
   'counts tick marks instead of spaces; forgets each space is a tenth')

ma(5, 'Geometry', 'lines of symmetry of a rectangle', 'M',
   'The figure shows a rectangle that is not a square. How many lines of symmetry does it have?',
   {'type': 'polygon', 'points': [[0, 0], [8, 0], [8, 4], [0, 4]], 'right': [0, 1, 2, 3]},
   '2', {'0': '0: a rectangle folds onto itself both across the middle and down the middle, so it has lines of symmetry.',
         '1': '1 finds only one of the two folds; the up-and-down fold and the side-to-side fold both work.',
         '4': '4 counts the diagonals too. Fold this rectangle along a diagonal and the corners do not meet: only a square has diagonal lines of symmetry.'},
   'A line of symmetry is a fold where the two halves match exactly. This rectangle folds down the middle and across the middle: 2 lines. Its diagonals do not work, because it is longer than it is wide; only a square has 4.',
   'counts the diagonals of a non-square rectangle')

ma(6, 'Geometry', 'lines of symmetry of an equilateral triangle', 'M',
   'The figure shows a triangle with all three sides the same length. How many lines of symmetry does it have?',
   {'type': 'polygon', 'points': [[0, 0], [6, 0], [3, 5.2]]},
   '3', {'1': '1 finds only the fold straight up the middle; because every side is equal, the same fold works from each of the three corners.',
         '2': '2 misses one corner: there is a fold from every corner to the middle of the opposite side, and there are three corners.',
         '6': '6 counts the 3 corners and the 3 sides as separate folds, but each fold runs from a corner to the middle of the side across from it, so they are the same 3 lines.'},
   'Fold from any corner to the middle of the side across from it and the halves match. There are 3 corners, so there are 3 lines of symmetry.',
   'finds only the vertical fold; counts corners and sides separately')

ma(7, 'Geometry', 'classifying a quadrilateral on a grid', 'M',
   'The figure shows quadrilateral WXYZ on a coordinate grid. Which name best describes WXYZ?',
   {'type': 'grid', 'xmax': 8, 'ymax': 6, 'polygon': [[1, 1], [5, 1], [6, 4], [2, 4]],
    'points': [{'x': 1, 'y': 1, 'label': 'W'}, {'x': 5, 'y': 1, 'label': 'X'}, {'x': 6, 'y': 4, 'label': 'Y'}, {'x': 2, 'y': 4, 'label': 'Z'}]},
   'parallelogram', {'rectangle': 'A rectangle has four right angles; the slanted sides here meet the top and bottom at a tilt, not at a square corner.',
                     'rhombus': 'A rhombus has four equal sides. The top and bottom are 4 units long, but the slanted sides are shorter, so this is not a rhombus.',
                     'trapezoid': 'A trapezoid has only one pair of parallel sides. Here both pairs are parallel: the top and bottom run flat, and the two slanted sides lean the same way.'},
   'The top and bottom are both flat and 4 units long, and the two slanted sides lean the same way (over 1, up 3). Two pairs of parallel sides, with no right angles and not all sides equal, make a parallelogram.',
   'calls any slanted four-sided shape a trapezoid or rhombus')

ma(8, 'Geometry', 'classifying a quadrilateral on a grid', 'M',
   'The figure shows quadrilateral ABCD on a coordinate grid. Which name best describes ABCD?',
   {'type': 'grid', 'xmax': 8, 'ymax': 6, 'polygon': [[1, 1], [7, 1], [5, 4], [3, 4]],
    'points': [{'x': 1, 'y': 1, 'label': 'A'}, {'x': 7, 'y': 1, 'label': 'B'}, {'x': 5, 'y': 4, 'label': 'C'}, {'x': 3, 'y': 4, 'label': 'D'}]},
   'trapezoid', {'parallelogram': 'A parallelogram has two pairs of parallel sides. The slanted sides here lean toward each other, so only the top and bottom are parallel.',
                 'rectangle': 'A rectangle has four right angles; the slanted sides here are not square corners.',
                 'square': 'A square has four equal sides and four right angles. The bottom is 6 units and the top is only 2.'},
   'Only the top (2 units) and the bottom (6 units) are parallel; the two slanted sides lean in toward each other. A quadrilateral with exactly one pair of parallel sides is a trapezoid.',
   'expects slanted sides to mean parallelogram')

assert 4 * 2 * 3 == 24
ma(9, 'Volume', 'volume by counting cubes', 'M',
   'The figure shows a block built from small cubes. Each small cube has edges 1 centimeter long. What is the volume of the block?',
   {'type': 'cubes', 'w': 4, 'd': 2, 'h': 3},
   '24 cubic centimeters', {'8 cubic centimeters': '8 counts only the top layer (4 × 2); there are 3 layers like it.',
                            '9 cubic centimeters': '9 adds the edges (4 + 2 + 3); volume multiplies them: 4 × 2 × 3.',
                            '12 cubic centimeters': '12 counts only the front face (4 × 3); the block is 2 cubes deep, so there are two such slices.'},
   'The block is 4 cubes long, 2 cubes deep and 3 cubes tall. One layer has 4 × 2 = 8 cubes, and 3 layers make 8 × 3 = 24 cubes, so the volume is 24 cubic centimeters. Count the hidden cubes too.',
   'counts only what is visible; adds the edges')

assert 3 * 3 * 3 - 3 * 3 * 2 == 9
ma(10, 'Volume', 'cubes needed to complete a larger cube', 'H',
   'The figure shows a block built from small cubes. How many more small cubes are needed to make it into a large cube that is 3 cubes long, 3 cubes wide and 3 cubes tall?',
   {'type': 'cubes', 'w': 3, 'd': 3, 'h': 2},
   '9', {'3': '3 adds one row of cubes; the missing part is a whole layer, 3 cubes by 3 cubes.',
         '18': '18 is the number of cubes already in the block (3 × 3 × 2), not the number still needed.',
         '27': '27 is the whole large cube (3 × 3 × 3); take away the 18 already there.'},
   'The large cube needs 3 × 3 × 3 = 27 cubes. The block has 3 × 3 × 2 = 18. 27 − 18 = 9 more — exactly one more layer of 3 × 3.',
   'gives the cubes already there; adds only one row')

PICT = {'type': 'pictograph', 'title': 'Books read in March', 'unit': '= 4 books',
        'rows': [{'label': 'Ana', 'count': 4}, {'label': 'Ben', 'count': 2.5}, {'label': 'Cole', 'count': 3}, {'label': 'Dee', 'count': 5}]}
ma(11, 'Data', 'reading a pictograph with a half symbol', 'M',
   'The pictograph shows how many books four students read in March. How many books did Ben read?',
   PICT, '10', {'2 1/2': '2 1/2 counts the symbols but does not use the key: each whole symbol stands for 4 books.',
                '9': '9 counts the half symbol as 1 book; half of a symbol is half of 4, which is 2.',
                '12': '12 rounds the half symbol up to a whole one (3 × 4); a half symbol is only 2 books.'},
   'Ben has 2 whole symbols and half of one. Each whole symbol is 4 books, so 2 × 4 = 8, and half a symbol is 2 more. 8 + 2 = 10 books.',
   'ignores the key; treats a half symbol as 1 or as a whole')

assert (4 + 5) * 4 - (2.5 + 3) * 4 == 14
ma(12, 'Data', 'comparing totals in a pictograph', 'H',
   'Use the pictograph of books read in March. How many more books did Ana and Dee read together than Ben and Cole read together?',
   PICT, '14', {'3 1/2': '3 1/2 is the difference in symbols (9 − 5 1/2); each symbol stands for 4 books.',
                '16': '16 leaves out Ben\'s half symbol: Ben and Cole read 10 + 12 = 22 books, not 20.',
                '58': '58 adds all four students; the question compares two pairs, so subtract.'},
   'Ana and Dee: 4 + 5 = 9 symbols = 36 books. Ben and Cole: 2 1/2 + 3 = 5 1/2 symbols = 22 books. 36 − 22 = 14.',
   'forgets the key; drops a half symbol')

ma(13, 'Data', 'median from a table', 'M',
   'The table shows Ravi\'s scores on five spelling tests. What is the median of his scores?',
   {'type': 'table', 'head': ['Test', 'Score'], 'rows': [['1', '84'], ['2', '91'], ['3', '78'], ['4', '95'], ['5', '88']]},
   '88', {'17': '17 is the range (95 − 78), how spread out the scores are, not the middle score.',
          '78': '78 is the middle row of the table, but the scores must be put in order first.',
          '87.2': '87.2 is the mean (436 ÷ 5); the median is the middle score once they are in order.'},
   'Put the scores in order: 78, 84, 88, 91, 95. The middle one of the five is 88, the median.',
   'takes the middle row without ordering; finds the mean or range instead')

assert sorted([12, 15, 9, 20, 15, 11])[2:4] == [12, 15]
ma(14, 'Data', 'median of an even number of values', 'H',
   'The table shows how many minutes Jo read each day for six days. What is the median number of minutes?',
   {'type': 'table', 'head': ['Day', 'Minutes'], 'rows': [['Mon', '12'], ['Tue', '15'], ['Wed', '9'], ['Thu', '20'], ['Fri', '15'], ['Sat', '11']]},
   '13.5', {'11': '11 is the range (20 − 9), not the middle.',
            '12': '12 is only the lower of the two middle numbers; with six values the median is halfway between 12 and 15.',
            '15': '15 is the mode, the number that appears most often, not the median.'},
   'In order: 9, 11, 12, 15, 15, 20. With six numbers there are two in the middle, 12 and 15. The median is halfway between them: (12 + 15) ÷ 2 = 13.5.',
   'picks one middle value of an even list; confuses median with mode or range')

ma(15, 'Data', 'range from a bar graph', 'M',
   'The graph shows how many goals each team scored this season. What is the range of the numbers of goals?',
   {'type': 'bar', 'title': 'Goals this season', 'y': 'Goals', 'step': 2, 'max': 18,
    'bars': [{'label': 'Lions', 'value': 14}, {'label': 'Tigers', 'value': 9}, {'label': 'Bears', 'value': 17}, {'label': 'Hawks', 'value': 6}]},
   '11', {'8': '8 subtracts the Tigers (17 − 9), but the lowest bar is the Hawks at 6.',
          '17': '17 is the highest bar alone; the range is highest minus lowest.',
          '46': '46 adds all four bars; the range is the difference between the highest and the lowest.'},
   'The highest bar is the Bears at 17 and the lowest is the Hawks at 6. Range = 17 − 6 = 11. The Tigers\' bar (9) and the Bears\' (17) stop between grid lines, so read them carefully.',
   'misreads a bar between grid lines; gives the maximum or the total')

ma(16, 'Data', 'finding two bars with a given total', 'M',
   'The graph shows how many students chose each fruit as their favorite. Which two fruits were chosen by 20 students altogether?',
   {'type': 'bar', 'title': 'Favorite fruit', 'y': 'Students', 'step': 2, 'max': 14,
    'bars': [{'label': 'Apples', 'value': 6}, {'label': 'Bananas', 'value': 12}, {'label': 'Grapes', 'value': 8}, {'label': 'Pears', 'value': 10}]},
   'bananas and grapes', {'apples and pears': 'Apples and pears are 6 + 10 = 16 students, not 20.',
                          'grapes and pears': 'Grapes and pears are 8 + 10 = 18 students, not 20.',
                          'apples and bananas': 'Apples and bananas are 6 + 12 = 18 students, not 20.'},
   'Read each bar against the grid lines, which go up by 2: apples 6, bananas 12, grapes 8, pears 10. Bananas and grapes make 12 + 8 = 20.',
   'adds the wrong pair of bars')

ma(17, 'Data', 'mode from a two-row table', 'E',
   'The table shows how many minutes Sam practiced the violin on four days of each week for two weeks. What is the mode of this set of data?',
   {'type': 'table', 'head': ['Week', 'Mon', 'Tue', 'Wed', 'Thu'], 'rows': [['1', '20', '15', '25', '20'], ['2', '30', '20', '15', '25']]},
   '20', {'15': '15 appears twice; 20 appears three times, more than any other number.',
          '21.25': '21.25 is the mean (170 ÷ 8); the mode is the number that appears most often.',
          '30': '30 is the largest number and appears only once.'},
   'Count each number in both rows: 20 appears 3 times, 15 twice, 25 twice and 30 once. The mode is the number that appears most often: 20.',
   'reads only one row; confuses mode with mean or maximum')

ma(18, 'Data', 'greatest increase on a line graph', 'M',
   'The graph shows how many visitors came to a museum each day. Between which two days did the number of visitors increase the most?',
   {'type': 'line', 'title': 'Museum visitors', 'y': 'Visitors (hundreds)', 'step': 3, 'max': 27,
    'points': [{'label': 'Mon', 'value': 12}, {'label': 'Tue', 'value': 18}, {'label': 'Wed', 'value': 15}, {'label': 'Thu', 'value': 24}, {'label': 'Fri', 'value': 21}]},
   'Wednesday to Thursday', {'Monday to Tuesday': 'Monday to Tuesday goes up 6 (12 to 18), but Wednesday to Thursday goes up 9.',
                             'Thursday to Friday': 'Thursday has the most visitors, but from Thursday to Friday the line goes down.',
                             'Tuesday to Wednesday': 'From Tuesday to Wednesday the line goes down, from 18 to 15.'},
   'Find the change between each pair of days: Mon→Tue +6, Tue→Wed −3, Wed→Thu +9, Thu→Fri −3. The steepest climb is Wednesday to Thursday.',
   'picks the highest point instead of the biggest climb')

ma(19, 'Measurement', 'elapsed time from a clock', 'M',
   'The clock shows the time a movie began. The movie lasted 1 hour 35 minutes. What time did it end?',
   {'type': 'clock', 'h': 3, 'm': 40},
   '5:15', {'4:15': '4:15 adds the 35 minutes but forgets the 1 hour.',
            '5:05': '5:05 subtracts the minutes (40 − 35) instead of adding them.',
            '6:15': '6:15 reads the clock as 4:40 because the hour hand is close to the 4; it has not reached 4 yet, so the movie began at 3:40.'},
   'The clock shows 3:40: the minute hand is on the 8 and the hour hand has not yet reached the 4. Add 1 hour: 4:40. Add 35 minutes: 4:40 + 20 minutes = 5:00, plus 15 more = 5:15.',
   'reads the hour from the number the hour hand is nearest; forgets an hour')

assert 2 * (8 + 6) == 28
ma(20, 'Perimeter', 'perimeter of a shape with unlabeled sides', 'M',
   'The figure shows the floor of a room, seen from above. Every side meets the next at a right angle. What is the perimeter of the floor?',
   {'type': 'polygon', 'points': [[0, 0], [8, 0], [8, 3], [3, 3], [3, 6], [0, 6]], 'right': [0, 1, 2, 4, 5],
    'labels': [{'side': 0, 'text': '8 m'}, {'side': 1, 'text': '3 m'}, {'side': 4, 'text': '3 m'}, {'side': 5, 'text': '6 m'}]},
   '28 m', {'20 m': '20 m adds only the four labeled sides; the two unlabeled sides (5 m and 3 m) count too.',
            '25 m': '25 m finds the 5 m side but leaves out the other unlabeled side, which is 6 − 3 = 3 m.',
            '33 m': '33 is the area in square meters (8 × 3 + 3 × 3), not the distance around.'},
   'Find the two unlabeled sides. The top step is 8 − 3 = 5 m across, and the short upright side is 6 − 3 = 3 m. Add all six: 8 + 3 + 5 + 3 + 3 + 6 = 28 m.',
   'adds only the labeled sides; finds area instead')

ma(21, 'Fractions', 'fraction of a shaded grid', 'E',
   'What fraction of the grid is shaded?',
   {'type': 'shaded', 'shape': 'grid', 'parts': 20, 'shaded': 8, 'cols': 5},
   '2/5', {'3/5': '3/5 is the unshaded part (12 of 20).',
           '2/3': '2/3 compares shaded to unshaded (8 to 12); a fraction of the grid compares shaded to all 20 squares.',
           '3/2': '3/2 compares unshaded to shaded (12 to 8), and is more than a whole grid.'},
   '8 of the 20 squares are shaded: 8/20. Divide both by 4 to get 2/5.',
   'compares shaded to unshaded instead of to the whole')

ma(22, 'Coordinates', 'moving a point on a grid', 'M',
   'Point K is on the coordinate grid. Kofi moves point K 2 units to the left and 3 units up. What are the new coordinates of point K?',
   {'type': 'grid', 'xmax': 8, 'ymax': 8, 'points': [{'x': 5, 'y': 3, 'label': 'K'}]},
   '(3, 6)', {'(2, 5)': '(2, 5) mixes up the two moves: it goes 3 left and 2 up.',
              '(6, 3)': '(6, 3) has the right numbers in the wrong order; the first number is how far across.',
              '(7, 6)': '(7, 6) moves 2 to the right; left makes the first number smaller.'},
   'K starts at (5, 3). Left 2 changes the across number: 5 − 2 = 3. Up 3 changes the up number: 3 + 3 = 6. The new point is (3, 6).',
   'moves the wrong way; swaps the coordinates')

assert round(5 - (3 * 0.45 + 2 * 0.60), 2) == 2.45
ma(23, 'Decimals', 'making change from a price table', 'H',
   'The table shows prices at the school store. Lena buys 3 pencils and 2 erasers and pays with a $5 bill. How much change should she get?',
   {'type': 'table', 'head': ['Item', 'Price'], 'rows': [['Pencil', '$0.45'], ['Eraser', '$0.60'], ['Notebook', '$1.25'], ['Ruler', '$0.89']]},
   '$2.45', {'$2.55': '$2.55 is what she spends (3 × $0.45 + 2 × $0.60); the question asks for her change from $5.',
             '$3.55': '$3.55 subtracts the smaller digit from the larger in each place; $5.00 − $2.55 needs regrouping and is $2.45.',
             '$3.95': '$3.95 buys only one pencil and one eraser ($1.05); she buys 3 pencils and 2 erasers.'},
   '3 pencils: 3 × $0.45 = $1.35. 2 erasers: 2 × $0.60 = $1.20. Together $2.55. Change: $5.00 − $2.55 = $2.45.',
   'stops at the cost; uses one of each item; regrouping error')

ma(24, 'Data', 'reading bars that stop between grid lines', 'M',
   'The graph shows how many students signed up for each club. How many students signed up for soccer and art altogether?',
   {'type': 'bar', 'title': 'Club sign-ups', 'y': 'Students', 'step': 10, 'max': 40,
    'bars': [{'label': 'Soccer', 'value': 35}, {'label': 'Swim', 'value': 20}, {'label': 'Art', 'value': 25}, {'label': 'Chess', 'value': 15}]},
   '60', {'50': '50 reads the soccer and art bars down to the grid line below them (30 + 20); each stops halfway to the next line.',
          '70': '70 reads both bars up to the grid line above them (40 + 30).',
          '95': '95 adds all four clubs; the question asks only for soccer and art.'},
   'The grid lines go by 10, so a bar that stops halfway between two lines is 5 more than the lower one. Soccer is 35 and art is 25. 35 + 25 = 60.',
   'rounds a between-lines bar down or up to the nearest grid line')

# ------------------------------------------------------------------ Quantitative Reasoning
qr(1, 'Probability', 'probability on a spinner with unequal sections', 'E',
   'The spinner is divided into the three sections shown. If the arrow is spun once, what is the probability that it lands on green?',
   {'type': 'spinner', 'sectors': [{'label': 'Red', 'size': 1}, {'label': 'Blue', 'size': 1}, {'label': 'Green', 'size': 2}]},
   '1 out of 2', {'1 out of 4': '1 out of 4 is the chance of landing on red (or on blue); green is twice as big as each of them.',
                  '1 out of 3': '1 out of 3 treats the three sections as the same size; green covers half of the spinner.',
                  '3 out of 4': '3 out of 4 is the chance of NOT landing on red — a different question.'},
   'The green section takes up half of the spinner, the same space as red and blue together. So the arrow lands on green 1 out of 2 times.',
   'treats unequal sections as equally likely')

qr(2, 'Probability', 'probability of a factor on a numbered spinner', 'M',
   'The spinner has eight equal sections numbered 1 to 8. If the arrow is spun once, what is the probability that it lands on a number that is a factor of 6?',
   {'type': 'spinner', 'sectors': [{'label': str(n)} for n in range(1, 9)]},
   '1 out of 2', {'1 out of 4': '1 out of 4 counts only 2 and 3; 1 and 6 are factors of 6 as well.',
                  '3 out of 8': '3 out of 8 forgets that 1 is a factor of every number: 1 × 6 = 6.',
                  '1 out of 8': '1 out of 8 counts only the 6 itself; 1, 2 and 3 are factors of 6 too.'},
   'The factors of 6 are 1, 2, 3 and 6, and all four are on the spinner. That is 4 out of 8 equal sections, which is the same chance as 1 out of 2.',
   'forgets 1 and the number itself are factors')

qr(3, 'Data reasoning', 'reading one circle of a Venn diagram', 'M',
   'Ms. Lee asked the 19 students in her class whether they play soccer or the piano. The Venn diagram shows the results. How many students play soccer?',
   {'type': 'venn', 'left': 'Soccer', 'right': 'Piano', 'counts': {'left': 7, 'both': 4, 'right': 5, 'outside': 3}},
   '11', {'4': '4 is only the students who do both; the soccer players who do not play piano count too.',
          '7': '7 is only the part of the soccer circle outside the piano circle; the 4 in the middle play soccer as well.',
          '3': '3 is the students outside both circles, who play neither soccer nor the piano.'},
   'Everyone inside the soccer circle plays soccer, including the overlap. 7 + 4 = 11. The 19 in the question is the whole class, which this question does not need.',
   'reads only the outer part of a circle')

qr(4, 'Data reasoning', 'total from a Venn diagram', 'H',
   'The Venn diagram shows how many students in a club have a dog, a cat, both or neither. How many students are in the club?',
   {'type': 'venn', 'left': 'Has a dog', 'right': 'Has a cat', 'counts': {'left': 9, 'both': 3, 'right': 6, 'outside': 2}},
   '20', {'15': '15 adds only the dog-only and cat-only parts (9 + 6), missing the 3 with both and the 2 with neither.',
          '18': '18 leaves out the 2 students outside both circles; they are in the club too.',
          '23': '23 counts the 3 students with both pets twice; each student is in only one region.'},
   'Each student is in exactly one region. 9 + 3 + 6 + 2 = 20.',
   'counts the overlap twice; forgets the outside region')

qr(5, 'Data reasoning', 'regions of a three-circle Venn diagram', 'H',
   'The Venn diagram shows which sports students in a club play. How many students play exactly two of the three sports?',
   {'type': 'venn3', 'a': 'Soccer', 'b': 'Swimming', 'c': 'Tennis',
    'counts': {'a': 4, 'b': 3, 'c': 5, 'ab': 2, 'ac': 1, 'bc': 3, 'abc': 1, 'outside': 2}},
   '6', {'1': '1 is the center, the student who plays all three sports, not exactly two.',
         '7': '7 adds the center too; exactly two means inside two circles and outside the third.',
         '19': '19 is everyone who plays at least one sport.'},
   'The regions inside exactly two circles are soccer-and-swimming (2), soccer-and-tennis (1) and swimming-and-tennis (3). 2 + 1 + 3 = 6. The center (1) is three sports, so it is left out.',
   'includes the center in "exactly two"')

qr(6, 'Measurement', 'elapsed time from a clock', 'M',
   'The clock shows the time the bus left school. The trip to the zoo took 25 minutes. What time did the bus reach the zoo?',
   {'type': 'clock', 'h': 10, 'm': 50},
   '11:15', {'10:15': '10:15 adds 25 minutes but does not move to the next hour after 60 minutes.',
             '10:35': '10:35 reads the minute hand\'s number as the minutes (10:10); the minute hand on the 10 means 50 minutes.',
             '11:25': '11:25 reads the hour as 11 because the hour hand is close to it; the bus left at 10:50, not 11:00.'},
   'The clock shows 10:50. Ten more minutes is 11:00, and 15 more is 11:15.',
   'reads the minute hand\'s number as minutes; reads the nearest hour')

qr(7, 'Volume', 'adding a layer of cubes', 'M',
   'The block is built from small cubes, each with a volume of 1 cubic inch. Maya adds one more layer on top, exactly like the top layer. What will the volume of the block be then?',
   {'type': 'cubes', 'w': 3, 'd': 2, 'h': 2},
   '18 cubic inches', {'36 cubic inches': '36 triples the block (12 × 3); only one layer of 3 × 2 = 6 cubes is added.',
                       '15 cubic inches': '15 adds only one row of 3; a whole layer is 2 rows deep.',
                       '24 cubic inches': '24 doubles the whole block; one layer is added, not two.'},
   'The block has 2 layers of 3 × 2 = 6 cubes, so 12 now. One more layer adds 6: 12 + 6 = 18 cubic inches.',
   'adds a row instead of a layer; doubles the block')

qr(8, 'Geometry', 'unfolding a shape along a fold', 'M',
   'The figure is half of a paper shape. The dashed side is the fold. When the paper is unfolded, what shape will it be?',
   {'type': 'polygon', 'points': [[0, 0], [4, 0], [0, 3]], 'right': [0], 'dashed': [2]},
   'triangle', {'kite': 'A kite would come from reflecting across the long slanted side; the fold here is the upright dashed side.',
                'rectangle': 'A rectangle needs four right angles; the mirror image across the dashed side makes a shape with three corners.',
                'square': 'A square needs four equal sides and four corners; the unfolded shape has three corners.'},
   'Reflect the triangle across the dashed side, like opening a folded paper. The bottom side doubles to 8 and the two slanted sides match, making one larger triangle with two equal sides.',
   'reflects across the wrong side')

qr(9, 'Pattern', 'using an input/output rule', 'M',
   'Use the table to answer the question. If the same rule is used, what is the output when the input is 10?',
   {'type': 'table', 'head': ['Input', 'Output'], 'rows': [['2', '7'], ['4', '11'], ['5', '13'], ['8', '19']]},
   '23', {'13': '13 only adds 3 (10 + 3); the rule also doubles the input first.',
          '20': '20 only doubles (10 × 2); every output is 3 more than double the input.',
          '21': '21 adds 2 to the last output; the input went up by 2, so the output goes up by 2 × 2 = 4.'},
   'Each output is double the input plus 3: 2 → 7, 4 → 11, 5 → 13, 8 → 19. For 10: 10 × 2 + 3 = 23.',
   'continues the output column instead of using the rule')

qr(10, 'Pattern', 'finding the rule that fits every row', 'H',
   'Use the table to answer the question. Which rule gives each output from its input?',
   {'type': 'table', 'head': ['Input', 'Output'], 'rows': [['1', '4'], ['3', '10'], ['6', '19'], ['7', '22']]},
   'multiply by 3, then add 1', {'add 3': 'Add 3 works for the first row (1 → 4) but gives 6 for 3, not 10.',
                                 'multiply by 4': 'Multiply by 4 works for the first row but gives 12 for 3, not 10.',
                                 'multiply by 2, then add 2': 'Doubling and adding 2 works for the first row but gives 8 for 3, not 10. A rule has to work for every row.'},
   'Check every row: 1 × 3 + 1 = 4, 3 × 3 + 1 = 10, 6 × 3 + 1 = 19, 7 × 3 + 1 = 22. The other rules only fit the first row.',
   'checks only the first row')

qr(11, 'Data reasoning', 'fraction of a total from a bar graph', 'M',
   'Forty students voted for their favorite season. The graph shows the results. What fraction of the students chose summer or winter?',
   {'type': 'bar', 'title': 'Favorite season', 'y': 'Students', 'step': 5, 'max': 20,
    'bars': [{'label': 'Summer', 'value': 15}, {'label': 'Winter', 'value': 5}, {'label': 'Spring', 'value': 12}, {'label': 'Fall', 'value': 8}]},
   '1/2', {'1/8': '1/8 is winter alone (5 of 40).',
           '1/5': '1/5 is the fall bar (8 of 40), the wrong season.',
           '3/8': '3/8 is summer alone (15 of 40); the question asks for summer or winter.'},
   'Summer 15 plus winter 5 is 20 students. 20 of 40 is 1/2.',
   'uses only one of the two bars')

qr(12, 'Data reasoning', 'comparing rows of a pictograph', 'M',
   'The pictograph shows how many cups of lemonade a stand sold each day. How many more cups were sold on Tuesday than on Wednesday?',
   {'type': 'pictograph', 'title': 'Lemonade sold', 'unit': '= 6 cups',
    'rows': [{'label': 'Monday', 'count': 3}, {'label': 'Tuesday', 'count': 4.5}, {'label': 'Wednesday', 'count': 2}, {'label': 'Thursday', 'count': 3.5}]},
   '15', {'27': '27 is all of Tuesday\'s cups (4 1/2 × 6); the question asks how many more than Wednesday.',
          '12': '12 leaves out Tuesday\'s half symbol (4 − 2 = 2 symbols); half a symbol is 3 cups.',
          '18': '18 counts the half symbol as a whole one; it stands for only 3 cups.'},
   'Tuesday has 4 1/2 symbols and Wednesday 2, a difference of 2 1/2 symbols. Each is 6 cups: 2 × 6 = 12, and half a symbol is 3. 12 + 3 = 15 cups.',
   'forgets the key; mishandles the half symbol')

qr(13, 'Number sense', 'halfway point on a number line', 'M',
   'Use the number line to answer the question. Point M is halfway between point P and point R. What number is at point M?',
   {'type': 'numberline', 'min': 0, 'max': 60, 'step': 5, 'labelEvery': 2, 'points': [{'at': 15, 'label': 'P'}, {'at': 45, 'label': 'R'}]},
   '30', {'15': '15 is how far M is from P (half of 30), not where M is on the line.',
          '45': '45 is where R is; M is between P and R.',
          '60': '60 adds P and R (15 + 45); halfway is that sum divided by 2.'},
   'P is at 15 and R is at 45, 30 apart. Half of 30 is 15, so M is 15 past P: 15 + 15 = 30.',
   'gives the half-distance instead of the point')

qr(14, 'Geometry', 'completing a rectangle on a grid', 'M',
   'Points J, K and L are three corners of a rectangle. Where should point M go to make rectangle JKLM?',
   {'type': 'grid', 'xmax': 9, 'ymax': 9, 'points': [{'x': 2, 'y': 3, 'label': 'J'}, {'x': 2, 'y': 8, 'label': 'K'}, {'x': 7, 'y': 8, 'label': 'L'}]},
   '(7, 3)', {'(3, 7)': '(3, 7) has the right numbers in the wrong order: M is 7 across and 3 up.',
              '(5, 5)': '(5, 5) is near the middle of the rectangle, not a corner.',
              '(7, 8)': '(7, 8) is where L already is.'},
   'M must be straight below L (same across number, 7) and straight across from J (same up number, 3). So M is at (7, 3).',
   'swaps the coordinates')

qr(15, 'Perimeter', 'missing width from the perimeter', 'H',
   'The rectangle in the figure has a perimeter of 30 centimeters. What is its width?',
   {'type': 'polygon', 'points': [[0, 0], [9, 0], [9, 6], [0, 6]], 'right': [0, 1, 2, 3], 'labels': [{'side': 0, 'text': '9 cm'}, {'side': 1, 'text': '?'}]},
   '6 cm', {'12 cm': '12 cm takes away both lengths (30 − 9 − 9) but forgets that the 12 is two widths together.',
            '15 cm': '15 cm is half the perimeter, one length and one width together; take away the 9.',
            '21 cm': '21 cm takes away only one length; the rectangle has two lengths and two widths.'},
   'Half the perimeter is one length plus one width: 30 ÷ 2 = 15. Take away the length: 15 − 9 = 6 cm.',
   'forgets there are two widths')

qr(16, 'Fractions', 'comparing a fraction to a shaded part', 'M',
   'Use the figure to answer the question. Which fraction is greater than the part of the circle that is shaded?',
   {'type': 'shaded', 'shape': 'circle', 'parts': 8, 'shaded': 3},
   '1/2', {'1/4': '1/4 is 2 of 8 parts, less than the 3 of 8 shaded.',
           '3/10': '3/10 has the same 3 on top, but tenths are smaller pieces than eighths, so it is less.',
           '1/3': '1/3 is a little less than 3/8 (one third of 8 parts is under 3 parts).'},
   '3 of 8 parts are shaded, which is less than half (4 of 8). So 1/2 is greater. 1/4 is 2/8, 1/3 is less than 3/8, and 3/10 uses smaller pieces.',
   'compares only the top numbers')

qr(17, 'Data reasoning', 'which statement a line graph supports', 'H',
   'The graph shows how many birds came to a feeder each week. Which statement is true?',
   {'type': 'line', 'title': 'Birds at the feeder', 'y': 'Birds', 'step': 5, 'max': 25,
    'points': [{'label': 'Wk 1', 'value': 10}, {'label': 'Wk 2', 'value': 14}, {'label': 'Wk 3', 'value': 14}, {'label': 'Wk 4', 'value': 20}, {'label': 'Wk 5', 'value': 18}]},
   'The same number came in Week 2 and Week 3.',
   {'The most birds came in Week 5.': 'Week 5 is the last point but not the highest: Week 4 (20) is higher than Week 5 (18).',
    'The number of birds went up every week.': 'It stayed the same from Week 2 to Week 3 and went down from Week 4 to Week 5.',
    'Twice as many came in Week 4 as in Week 2.': 'Week 4 (20) is twice Week 1 (10), not Week 2 (14).'},
   'Weeks 2 and 3 are both at 14, so the line is flat there. Check each statement against the points, not the shape at a glance.',
   'reads the last point as the highest; compares with the wrong week')

assert 2 * 4 + 6 == 14
qr(18, 'Data reasoning', 'choosing the needed column of a table', 'M',
   'The table shows fruit sold at a farm stand. Rosa buys 2 bags of apples and 1 bag of pears. How much does she spend?',
   {'type': 'table', 'head': ['Fruit', 'Price per bag', 'Pounds per bag'], 'rows': [['Apples', '$4', '3'], ['Oranges', '$5', '4'], ['Pears', '$6', '2']]},
   '$14', {'$20': '$20 buys 2 bags of pears as well (2 × 4 + 2 × 6); she buys only 1 bag of pears.',
           '$10': '$10 buys one bag of each (4 + 6); she buys 2 bags of apples.',
           '$16': '$16 reads the oranges row for the second fruit (2 × 5 + 6).'},
   'Use the price column only: 2 bags of apples are 2 × $4 = $8, and a bag of pears is $6. $8 + $6 = $14. The pounds column is extra information.',
   'uses the wrong column or row')

assert 8 * 5 - (6 + 9 + 5 + 8) == 12
qr(19, 'Data reasoning', 'missing value for a target mean', 'H',
   'The graph shows how many laps Theo swam from Monday to Thursday. How many laps must he swim on Friday so that he swims an average of 8 laps a day over the five days?',
   {'type': 'bar', 'title': 'Laps swum', 'y': 'Laps', 'step': 1, 'max': 10,
    'bars': [{'label': 'Mon', 'value': 6}, {'label': 'Tue', 'value': 9}, {'label': 'Wed', 'value': 5}, {'label': 'Thu', 'value': 8}]},
   '12', {'7': '7 is his average so far (28 ÷ 4); Friday has to pull the average up to 8.',
          '8': '8 is the average he wants; he is behind, so Friday must be more than 8.',
          '40': '40 is the total for all five days (5 × 8); take away the 28 he has already swum.'},
   'An average of 8 over 5 days is 5 × 8 = 40 laps in all. He has 6 + 9 + 5 + 8 = 28. 40 − 28 = 12 laps on Friday.',
   'gives the average instead of the missing value')

qr(20, 'Perimeter', 'side of a shape with equal sides', 'M',
   'Every side of the figure is the same length. Its perimeter is 42 inches. How long is one side?',
   {'type': 'polygon', 'points': [[2, 0], [6, 0], [8, 3.5], [6, 7], [2, 7], [0, 3.5]]},
   '7 inches', {'6 inches': '6 inches divides by 7; the figure has 6 sides.',
                '10.5 inches': '10.5 inches divides by 4 as if it were a square; count the sides — there are 6.',
                '36 inches': '36 inches subtracts the number of sides (42 − 6); share the perimeter among the sides by dividing.'},
   'The figure has 6 equal sides, so each is 42 ÷ 6 = 7 inches.',
   'miscounts the sides; subtracts instead of dividing')

qr(21, 'Pattern', 'growing pattern in a table', 'M',
   'The table shows how many tiles are in each figure of a pattern. If the pattern continues, how many tiles will Figure 6 have?',
   {'type': 'table', 'head': ['Figure', 'Tiles'], 'rows': [['1', '4'], ['2', '7'], ['3', '10'], ['4', '13']]},
   '19', {'16': '16 is Figure 5; Figure 6 is one more step of 3.',
          '18': '18 multiplies 6 × 3 but forgets that each figure is 1 more than 3 times its number.',
          '24': '24 multiplies 6 × 4, using only the first row (1 → 4).'},
   'Each figure adds 3 tiles: 4, 7, 10, 13, then 16 for Figure 5 and 19 for Figure 6.',
   'stops one figure early; uses only the first row')

qr(22, 'Probability', 'probability from a table of counts', 'M',
   'The table shows the marbles in a bag. If one marble is picked without looking, which color has a 1 out of 5 chance of being picked?',
   {'type': 'table', 'head': ['Color', 'Marbles'], 'rows': [['Red', '6'], ['Blue', '4'], ['Green', '2'], ['Yellow', '8']]},
   'blue', {'green': 'Green is 2 of 20 marbles, a 1 out of 10 chance.',
            'red': 'Red is 6 of 20 marbles, a 3 out of 10 chance.',
            'yellow': 'Yellow is 8 of 20 marbles, a 2 out of 5 chance, not 1 out of 5.'},
   'There are 6 + 4 + 2 + 8 = 20 marbles. 1 out of 5 is the same as 4 out of 20, and there are 4 blue marbles.',
   'forgets to find the total first')

qr(23, 'Number sense', 'placing a number in a Venn diagram', 'M',
   'The Venn diagram sorts some numbers. In which part of the diagram does the number 18 belong?',
   {'type': 'venn', 'left': 'Multiples of 3', 'right': 'Even numbers',
    'items': {'left': ['9', '15'], 'both': ['6', '12'], 'right': ['4', '8', '10'], 'outside': ['5', '7']}},
   'in both circles', {'outside both circles': 'Eighteen is even and a multiple of 3, so it belongs inside both circles, not outside them.',
                       'only in "Even numbers"': 'Eighteen is also 3 × 6, a multiple of 3, so it goes in the overlap.',
                       'only in "Multiples of 3"': 'Eighteen is also even, so it goes in the overlap.'},
   '18 is even (18 = 2 × 9) and a multiple of 3 (18 = 3 × 6). A number that fits both labels goes where the circles overlap.',
   'checks only one label')

qr(24, 'Geometry', 'reflecting a point across a line on a grid', 'H',
   'The triangle on the grid is flipped over the dashed line. Where does the corner at (2, 6) land?',
   {'type': 'grid', 'xmax': 10, 'ymax': 8, 'polygon': [[2, 2], [4, 2], [2, 6]], 'lines': [[[5, 0], [5, 8]]]},
   '(8, 6)', {'(6, 2)': '(6, 2) swaps the numbers of the corner\'s position; a flip over an upright line keeps the up number, 6.',
              '(7, 6)': '(7, 6) lands 2 past the line; the corner is 3 units left of the line, so it lands 3 units right of it.',
              '(8, 2)': '(8, 2) is where the corner at (2, 2) lands; the question asks about (2, 6).'},
   'The dashed line is at 5. The corner at (2, 6) is 3 units left of it, so it lands 3 units right: 5 + 3 = 8. A flip over an upright line does not change the up number. The image is (8, 6).',
   'miscounts the distance to the line; flips the wrong corner')

def write(bank, items):
    path = f'content/question-banks/{bank}.json'
    json.dump({'bank': bank, 'schema_version': '1.0', 'content_version': VER, 'items': items},
              open(path, 'w'), indent=1, ensure_ascii=False)
    open(path, 'a').write('\n')
    print(f'{path}: {len(items)} items, keys {"".join(i["correct"] for i in items)}')

if __name__ == '__main__':
    assert len(MA) == 24 and len(QR) == 24
    write('ma-figures-plus', MA)
    write('qr-figures-plus', QR)
