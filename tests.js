let gOrderN = -1;   // order number task in User window: 1, 2, 3...
let gN = -1;   // real number in test
let A = [];   // mix questions
let B = [];   // mix answers
let pause = false;   // pause beetween select answer

//-----------------------------------------------------------------------------
//-----------------------------------------------------------------------------
function GetMixArray(size, mix) {
  let rndNum = 0;
  let nums = [];
  for (let i = 0; i < size; i++) {
    nums.push(i);
  }
  if (mix) {
    for (let i = size - 1; i >= 0; i--) {
      rndNum = Math.floor(Math.random() * (i + 1));
      [nums[i], nums[rndNum]] = [nums[rndNum], nums[i]];
    }
  }
  return nums;
}

//-----------------------------------------------------------------------------
function CorrectCount(questNum) {
  let count = 0;
  for (let i = 0; i < test.Questions[questNum].Answers.length; i++) {
    if (test.Questions[questNum].Answers[i].cr) count++;
  }
  return count;
}

//-----------------------------------------------------------------------------
function SelectCount(questNum) {
  let count = 0;
  for (let i = 0; i < test.Questions[questNum].Answers.length; i++) {
    if (test.Questions[questNum].Answers[i].Select) count++;
  }
  return count;
}

//-----------------------------------------------------------------------------
function CorrectSelectCount(questNum) {
  let count = 0;
  for (let i = 0; i < test.Questions[questNum].Answers.length; i++) {
    if (test.Questions[questNum].Answers[i].Select && 
      test.Questions[questNum].Answers[i].cr) count++;
  }
  return count;
}

//-----------------------------------------------------------------------------
function WrongSelectCount(questNum) {
  let count = 0;
  for (let i = 0; i < test.Questions[questNum].Answers.length; i++) {
    if (test.Questions[questNum].Answers[i].Select &&
      !test.Questions[questNum].Answers[i].cr) count++;
  }
  return count;
}

//-----------------------------------------------------------------------------
function ChoiceCount() {
  let count = 0;
  for (let i = 0; i < test.Questions.length; i++) {
    if (SelectCount(i) > 0) count++;
  }
  return count;
}

//-----------------------------------------------------------------------------
function MFromN(M, N) {
  if (M < 0 || N <= 0 || M > N) return 0;

  let x = 1;
  for (let i = 1; i <= N; i++) {
    x *= i;
  }
  let y = 1;
  for (let i = 1; i <= M; i++) {
    y *= i;
  }
  let z = 1;
  for (let i = 1; i <= N - M; i++) {
    z *= i;
  }
  return x / (y * z);
}

//-----------------------------------------------------------------------------
function GetPenaltyPoint() {
  let numerator = 0;
  let denominator = 0;
  let statMinus = 0;
  for (let i = 0; i < test.Questions.length; i++) {
    statMinus = MFromN(SelectCount(i) - 1, 
      test.Questions[i].Answers.length - 1);
    numerator += statMinus;
    denominator += (test.Questions[i].Answers.length - CorrectCount(i)) * 
      statMinus;
  }
  if (denominator === 0) {
    return 0;
  } else {
    return numerator / denominator;
  }
}

//-----------------------------------------------------------------------------
function GetPointsPercent() {
  let pointSum = 0;
  let wrongAnswersCount = 0;
  for (let i = 0; i < test.Questions.length; i++) {
    pointSum += CorrectSelectCount(i) / CorrectCount(i);
    wrongAnswersCount += WrongSelectCount(i);
  }
  if (test.IsPenalty) pointSum -= wrongAnswersCount * GetPenaltyPoint();
  return 100 * pointSum / test.Questions.length;
}

//-----------------------------------------------------------------------------
function GetMark(markPercent) {
  if (test.MinMark < 0 || test.MaxMark < 0 || 
    test.MinMark >= test.MaxMark) return -1;
  if (markPercent > 100) markPercent = 100;
  if (markPercent < 0) markPercent = 0;

  let oneMarkStep = 100 / (test.MaxMark - test.MinMark);
  let isMarkWithPlus = test.MaxMark <= 9;
  if (isMarkWithPlus) oneMarkStep /= 2;

  let mark = 0;
  if (markPercent > 0) mark = 
    Math.floor(Math.abs(markPercent / oneMarkStep - 0.00001)) + 1;

  let res = test.MinMark + mark;
  if (isMarkWithPlus) {
    res = test.MinMark + Math.floor(mark / 2);
    if (mark % 2 === 1) return String(res) + '+';
  }

  return String(res);
}

//-----------------------------------------------------------------------------
//-----------------------------------------------------------------------------
function StartTest() {
  document.getElementById('questCount').innerHTML = 
    '(' + String(test.Questions.length) + ' пит.)';
  A = GetMixArray(test.Questions.length, true);
  NextQuestion();
}

//-----------------------------------------------------------------------------
function NextQuestion() {
  if (gOrderN >= test.Questions.length - 1) {
    ExitTest();
    return;
  }

  pause = false;
  gOrderN++;
  gN = A[gOrderN];
  B = GetMixArray(test.Questions[gN].Answers.length, 
    test.Questions[gN].RndAnswers);

    /* Header */
  document.getElementById('questNum').innerHTML = String(gOrderN + 1);

    /* Question */
  document.getElementById('quest').innerHTML = test.Questions[gN].Text;

    /* Answers */
  let c = CorrectCount(gN);
  document.getElementById('correctCount').innerHTML = 
    (c > 1) ? '(' + String(c) + ' відповіді)' : '.';
  for (let i = 0; i <= 5; i++) {
    document.getElementById('radio' + String(i)).type = 
      (c > 1) ? 'checkbox' : 'radio';
    document.getElementById('radio' + String(i)).checked = false;
    document.getElementById('answer' + String(i)).style.backgroundColor = 
      '(--js-answer-color)';
    document.getElementById('answer' + String(i)).hidden = 
      test.Questions[gN].Answers.length <= i;
    if (test.Questions[gN].Answers.length <= i) {
      document.getElementById('label' + String(i)).innerHTML = '';
    } else {
      document.getElementById('label' + String(i)).innerHTML = 
        test.Questions[gN].Answers[B[i]].Text;
    }
  }

    /* Obj */
  document.getElementById('questImg').src = test.Questions[gN].Obj;
  document.getElementById('questImg').hidden = test.Questions[gN].Obj === '';
  document.getElementById('questImg').alt = 
    test.Questions[gN].Obj === '' ? '' : 'Помилка зображення';
}

//-----------------------------------------------------------------------------
function CheckAnswer(num) {
    if (pause) return;

  document.getElementById('radio' + String(num)).checked = 
    !document.getElementById('radio' + String(num)).checked;
  if (document.getElementById('radio' + String(num)).checked) {
    document.getElementById('answer' + String(num)).style.backgroundColor = 
      '(--js-checked-answer-color)';
  } else {
    document.getElementById('answer' + String(num)).style.backgroundColor = 
      '(--js-answer-color)';
  }
  test.Questions[gN].Answers[B[num]].Select = 
    document.getElementById('radio' + String(num)).checked;
  if (SelectCount(gN) >= CorrectCount(gN)) {
    pause = true;
    setTimeout(NextQuestion, 400);
  }
}

//-----------------------------------------------------------------------------
function ExitTest() {
  document.getElementById('tests_header').style.display = 'none';
  document.getElementById('testForm').style.display = 'none';
  document.getElementById('questImg').hidden = true;

  document.getElementById('resForm').hidden = false;

  if (ChoiceCount() < 0.75 * test.Questions.length) {
    document.getElementById('resPercent').innerHTML = 'немає&nbsp;:(';
    document.getElementById('testMark').hidden = true;
  } else {
    let p = GetPointsPercent();
    document.getElementById('resPercent').innerHTML = 
      (p < 0) ? '< 0&nbsp;%' : String(Math.round(p)) + '&nbsp;%';

    let m = GetMark(p);
    document.getElementById('testMark').innerHTML = m;
    let new_m = m.replace('+', '');
    document.getElementById('testMark').style.backgroundColor = 
      '(--js-mark-' + new_m + ')';
  }
}