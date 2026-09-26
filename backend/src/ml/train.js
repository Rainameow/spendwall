const fs = require('fs');
const natural = require('natural');

// 1. Load the dataset file (tab-separated: page_id, text, label, category)
const raw = fs.readFileSync(__dirname + '/dataset.tsv', 'utf8').trim().split('\n');
raw.shift(); // remove header row

const rows = raw.map(line => {
  const [pageId, text, label, category] = line.split('\t');
  return { text, label: label === '1' ? 'dark_pattern' : 'normal', category };
});

// 2. Split into train (80%) and test (20%) sets, shuffled first
for (let i = rows.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [rows[i], rows[j]] = [rows[j], rows[i]];
}
const splitPoint = Math.floor(rows.length * 0.8);
const trainRows = rows.slice(0, splitPoint);
const testRows = rows.slice(splitPoint);

console.log(`Training on ${trainRows.length} examples, testing on ${testRows.length}`);

// 3. Train the classifier
const classifier = new natural.BayesClassifier();
trainRows.forEach(row => classifier.addDocument(row.text, row.label));
classifier.train();

// 4. Test it on examples it has NEVER seen, and count how many it got right
let correct = 0;
testRows.forEach(row => {
  const guess = classifier.classify(row.text);
  if (guess === row.label) correct++;
});
const accuracy = (correct / testRows.length * 100).toFixed(1);
console.log(`Accuracy on unseen test examples: ${accuracy}% (${correct}/${testRows.length})`);

// 5. Save the trained model so the server can load it later without retraining
classifier.save(__dirname + '/dark-pattern-model.json', (err) => {
  if (err) return console.error('Save failed:', err);
  console.log('Model saved to dark-pattern-model.json');
});
