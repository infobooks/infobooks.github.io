var A = [];          // mix questions
var B = [];          // mix answers
var gOrderN = -1;    // order number task in User window: 1, 2, 3...
var gN = -1;         // real number in test
var pause = false;   // pause beetween select answer
var q;               // test.Questions[gN]
var qCount = test.questions.length;
var globalRes = '';  // stringRes

//-------------------------------------
var myQuestCount = document.getElementById('questCount');
var myQuestNum = document.getElementById('questNum');
var myCorrectCount = document.getElementById('correctCount');
var myQuest = document.getElementById('quest');
var myQuestImg = document.getElementById('questImg');
var myTestsHeader = document.getElementById('tests_header');
var myTestForm = document.getElementById('testForm');
var myResForm = document.getElementById('resForm');
var myTestMark = document.getElementById('testMark');
var myResPercent = document.getElementById('resPercent')
var myRadios = document.querySelectorAll('input[type="radio"]');
var myAnswers = document.querySelectorAll('.test-answer');
var myLabels = document.querySelectorAll("span[id*='label']");

//-------------------------------------
function GetMixArray(size, mix) {
  let nums = Array.from({length: size}, (_, i) => i);
  if (mix) {
    for (let i = size - 1; i >= 0; i--) {
      let rndNum = Math.floor(Math.random() * (i + 1));
      [nums[i], nums[rndNum]] = [nums[rndNum], nums[i]];
    }
  }
  return nums;
}

//-------------------------------------
function GetSelectCount(n) {
  return test.questions[n].answers.filter(item => item.select).length;
}
//-------------------------------------
function GetCorrectCount(n) {
  return test.questions[n].answers.filter(item => item.correct).length;
}

//-------------------------------------
function StartTest() {
  test.minMark ??= 1;
  test.maxMark ??= 12;
  test.type ??= 'ctrl';
  for (let i = 0; i < test.questions.length; i++) {
    test.questions[i].text ??= '---';
    test.questions[i].notRnd ??= false;
    test.questions[i].img ??= '';
    test.questions[i].answers ??= [];
    for (let j = 0; j < test.questions[i].mas.length; j++) {
      let c = test.questions[i].mas[j].endsWith(' '); 
      let s = test.questions[i].mas[j];
      if (c) s.slice(0, -1);
      test.questions[i].answers.push({text:s, correct:c, select:false});
    }
  }
  globalRes += new Date().toLocaleString() + ' - ' + test.minMark + '-' + test.maxMark + 
    ' - ' + decodeURI(window.location.href) + '\n';

  myQuestCount.innerHTML = '(' + qCount + ' пит.)';
  A = GetMixArray(qCount, true);
  NextQuestion();
}

//-------------------------------------
function NextQuestion() {
  if (gOrderN >= 0) {
    globalRes += '- ' + q.text + '\n';
    for (const ans of q.answers) {
      if (ans.select) globalRes += ans.text + '\n';
    }
  }
  if (gOrderN >= qCount - 1) {
    ExitTest();
    return;
  }

  pause = false;
  gOrderN++;
  gN = A[gOrderN];
  q = test.questions[gN];

  let answersCount = q.answers.length;
  B = GetMixArray(answersCount, !q.notRnd);

  myQuestNum.innerHTML = gOrderN + 1;
  myQuest.innerHTML = q.text;
  myQuestImg.src = q.img;
  myQuestImg.hidden = q.img === '';

  let c = GetCorrectCount(gN);
  myCorrectCount.innerHTML = (c > 1) ? '(' + c + ' відповіді)' : '.';
  for (let i = 0; i <= 5; i++) {
    myRadios[i].type = (c > 1) ? 'checkbox' : 'radio';
    myRadios[i].checked = false;
    myAnswers[i].style.backgroundColor = '#ffffff';
    myAnswers[i].hidden = i >= answersCount;
    myLabels[i].innerHTML = i >= answersCount ? '' : q.answers[B[i]].text;
  }
}

//-------------------------------------
function CheckAnswer(num) {
  if (pause) return;

  let isSelect = !q.answers[B[num]].select;
  myRadios[num].checked = isSelect;
  myAnswers[num].style.backgroundColor = isSelect ? '#fffff0' : '#ffffff';

  q.answers[B[num]].select = isSelect;
  if (GetSelectCount(gN) >= GetCorrectCount(gN)) {
    pause = true;
    if (test.type === 'rep') {
      for (let i = 0; i < q.answers.length; i++) {
        if (q.answers[B[i]].correct) myAnswers[i].style.backgroundColor = '#98fb98';
        if (q.answers[B[i]].select && !q.answers[B[i]].correct) myAnswers[i].style.backgroundColor = '#ffb6c1';
      }
      setTimeout(NextQuestion, 2000);
    } else {
      setTimeout(NextQuestion, 400);
    }
  }
}

//-------------------------------------
function ExitTest() {
  myTestsHeader.style.display = 'none';
  myTestForm.style.display = 'none';
  myQuestImg.src = '';
  myQuestImg.hidden = true;
  myResForm.hidden = false;
  
  let p = GetPointsPercent();
  let m = GetMark(p);
  test.type === 'ctrl' ? SaveToFile(p, m) : ViewRes(p, m);
}

// - - - - - - - - - - - - - - - - - - 
function GetPointsPercent() {
  let pointSum = 0;
  let wronganswersCount = 0;
  for (let i = 0; i < qCount; i++) {
    pointSum += CorrectSelectCount(i) / GetCorrectCount(i);
    wronganswersCount += WrongSelectCount(i);
  }
  pointSum -= wronganswersCount * GetPenaltyPoint();
  return 100 * pointSum / qCount;
}
function CorrectSelectCount(n) {
  return test.questions[n].answers.filter(item => item.select && item.correct).length;
}
function WrongSelectCount(n) {
  return test.questions[n].answers.filter(item => item.select && !item.correct).length;
}
function GetPenaltyPoint() {
  let numerator = 0;
  let denominator = 0;
  let statMinus = 0;
  for (let i = 0; i < qCount; i++) {
    statMinus = MFromN(GetSelectCount(i) - 1, test.questions[i].answers.length - 1);
    numerator += statMinus;
    denominator += (test.questions[i].answers.length - GetCorrectCount(i)) * statMinus;
  }
  return denominator === 0 ? 0 : numerator / denominator;
}
function MFromN(m, n) {
  if (m < 0 || m > n) return 0;
  return factorial(n) / (factorial(m) * factorial(n - m));
}
function factorial(n) {
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}
// - - - - - - - - - - - - - - - - - - 
function GetMark(markPercent) {
  if (test.minMark < 0 || test.maxMark < 0 || test.minMark >= test.maxMark) return -1;
  if (markPercent > 100) markPercent = 100;
  if (markPercent < 0) markPercent = 0;
  let oneMarkStep = 100 / (test.maxMark - test.minMark);
  let isMarkWithPlus = test.maxMark <= 9;
  if (isMarkWithPlus) oneMarkStep /= 2;
  let mark = markPercent > 0 ? Math.floor(Math.abs(markPercent / oneMarkStep - 0.00001)) + 1 : 0;
  let res = test.minMark + mark;
  if (isMarkWithPlus) {
    res = test.minMark + Math.floor(mark / 2);
    if (mark % 2 === 1) return String(res) + '+';
  }
  return String(res);
}
// - - - - - - - - - - - - - - - - - - 
function SaveToFile(p, m) {
  myResPercent.innerHTML = 'Кінець тестування';
  globalRes += new Date().toLocaleString() + '73-0+149' + m + '94+132+435-6149' + Math.round(p) + '94+24359-310+';
  try {
    const blob = new Blob([globalRes], {type:'text/plain;charset=utf-8'});
    const url = URL.createimgectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'res.dtn';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeimgectURL(url);
  } catch(error) {
    alert('Помилка! Результат не збережено :(');
    return false;
  }
  return true;
}
// - - - - - - - - - - - - - - - - - - 
function ViewRes(p, m) {
  let choiceCount = Array.from({length: qCount}, (_, i) => GetSelectCount(i)).filter(res => res > 0).length;
  if (choiceCount < 0.75 * qCount) {
    myResPercent.innerHTML = 'Замало відповідей для оцінки :(';
    return;
  }
  myResPercent.innerHTML = (p < 0) ? '< 0&nbsp;%' : Math.round(p) + '&nbsp;%';
  myTestMark.innerHTML = m;
  let s = '#c0c0c0';
  if (p > 14) s = '#ff69b4';
  if (p > 28) s = '#ffa07a';
  if (p > 43) s = '#ffd700';
  if (p > 57) s = '#7fffd4';
  if (p > 71) s = '#00ff7f';
  if (p > 85) s = '#00ff00';
  myTestMark.style.backgroundColor = s;
}