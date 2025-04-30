const outrightRejectionList = [
  'cancer', 'heart attack', 'bypass', 'angioplasty', 'cad', 'valve disease',
  'heart failure', 'cardiomyopathy', 'pacemaker', 'stroke', 'cva', 'paralysis',
  'multiple sclerosis', 'epilepsy', 'seizure', 'brain tumour', 'ataxia', 'chorea',
  'motor neurone disease', 'muscular dystrophy', 'cerebral palsy', 'copd',
  'ild', 'osa', 'hepatitis b', 'hepatitis c', 'cirrhosis', 'liver failure',
  'kidney disease', 'nephrotic', 'nephritic', 'kidney failure', 'polycystic kidney',
  'pancreatitis', 'lupus', 'rheumatoid arthritis', 'ankylosing spondylitis',
  'inflammatory bowel', 'pituitary', 'adrenal', 'parathyroid', 'haemolytic',
  'thalassemia major', 'spherocytosis', 'haemophilia', 'bone marrow disorder',
  'type 1 diabetes', 'diabetes on insulin'
];
const comboList = ['diabetes', 'hypertension', 'lipid disorder', 'obesity', 'smoking'];
const abbreviations = ['htn', 'dm', 'cad', 'cva', 'copd', 'ild', 'osa'];

document.getElementById('fileUpload').addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;

  if (file.type === "application/pdf") {
    const fileReader = new FileReader();
    fileReader.onload = function () {
      const typedArray = new Uint8Array(this.result);
      pdfjsLib.getDocument(typedArray).promise.then(pdf => {
        let textContent = "";
        let totalPages = pdf.numPages;
        let loadedPages = 0;
        for (let i = 1; i <= totalPages; i++) {
          pdf.getPage(i).then(page => {
            page.getTextContent().then(txt => {
              txt.items.forEach(s => textContent += s.str + " ");
              loadedPages++;
              if (loadedPages === totalPages) {
                document.getElementById('illnessInput').value = textContent;
                realTimeCheck();
              }
            });
          });
        }
      });
    };
    fileReader.readAsArrayBuffer(file);
  } else {
    const reader = new FileReader();
    reader.onload = function (e) {
      document.getElementById('illnessInput').value = e.target.result;
      realTimeCheck();
    };
    reader.readAsText(file);
  }
});

function checkIllness() {
  const input = document.getElementById('illnessInput').value.toLowerCase();
  const illnesses = input.split(',').map(i => i.trim());
  let resultBox = document.getElementById('result');
  let warningBox = document.getElementById('warnings');
  resultBox.className = '';
  warningBox.innerHTML = '';

  let declinedDueTo = "";
  for (let illness of illnesses) {
    if (outrightRejectionList.some(c => illness.includes(c))) {
      declinedDueTo = illness;
      break;
    }
  }

  // Warning for abbreviations
  for (let abbr of abbreviations) {
    if (input.includes(abbr)) {
      warningBox.innerHTML += `⚠️ Please avoid using abbreviation "${abbr.toUpperCase()}" – use full term.<br>`;
    }
  }

  // Spell suggestion logic (simple fuzzy match)
  illnesses.forEach(word => {
    if (![...outrightRejectionList, ...comboList].some(item => word.includes(item))) {
      let suggestion = outrightRejectionList.find(d => levenshtein(d, word) <= 3);
      if (suggestion) {
        warningBox.innerHTML += `🤔 Did you mean "<b>${suggestion}</b>" instead of "${word}"?<br>`;
      }
    }
  });

  const foundCombos = illnesses.filter(i => comboList.some(c => i.includes(c)));
  if (declinedDueTo || foundCombos.length >= 3) {
    resultBox.innerText = `❌ Declined in the normal health insurance plan. Try your luck with a specialized plan exclusively meant for customers with pre-existing diseases.`;
    resultBox.classList.add('declined');
  } else {
    resultBox.innerText = '✅ Status: ACCEPTABLE';
    resultBox.classList.add('accepted');
  }
}

function realTimeCheck() {
  if (document.getElementById('illnessInput').value.trim() !== '') {
    checkIllness();
  }
}

function copyResult() {
  const text = document.getElementById('result').innerText;
  navigator.clipboard.writeText(text).then(() => {
    alert("Result copied to clipboard!");
  });
}

function levenshtein(a, b) {
  const dp = Array.from({length: a.length+1}, () => Array(b.length+1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i-1] === b[j-1] 
        ? dp[i-1][j-1] 
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    }
  }
  return dp[a.length][b.length];
}
