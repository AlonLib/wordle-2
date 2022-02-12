'use strict';
const keyBoardButtons = document.querySelectorAll('.key');
const modal = document.querySelector('.modal');
const endModal = document.querySelector('.end-modal');
const endModalBack = document.querySelector('.end-modal-back');
const endModalText = document.querySelector('.end-modal-text');
let currRow = 0;
let currCol = 0;
const ROW_SIZE = 5;
let currWord = Array();
const finalToRegular = {
    'ן': 'נ',
    'ם': 'מ',
    'ך': 'כ',
    'ף': 'פ',
    'ץ': 'צ'
}
const regularToFinal = {
    'נ': 'ן',
    'מ': 'ם',
    'כ': 'ך',
    'פ': 'ף',
    'צ': 'ץ'
}
const resultToImg = {
    'correct': '🟩',
    'present': '🟨️',
    'absent': '⬛️'
}
modal.classList.remove('hidden');
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const word = urlParams.get('word')
const today = new Date();
const word_index = word ? word : (today.getFullYear() + (today.getMonth() + 1) + today.getDate() % nouns.length)
const solution = nouns[word_index];
let resultString = "";
console.log(solution);

function createHistogram(word) {
    const histogram = {};
    for (let i = 0; i < word.length; ++i) {
        const currLetter = convertToReg(word[i]);
        if (currLetter in histogram) {
            histogram[currLetter]++;
        } else {
            histogram[currLetter] = 1;
        }
    }
    return histogram;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function showModal(modal, message) {
    modal.textContent = message;
    modal.classList.add('modal-show');
    sleep(800).then(() => {
        modal.classList.remove('modal-show');
    })
}

function getCurrCell() {
    return (5 * currRow) + currCol;

}

function convertLetter(letter) {
    if (currCol === ROW_SIZE - 1 && letter in regularToFinal) {
        return regularToFinal[letter];
    } else if (currCol !== ROW_SIZE - 1 && letter in finalToRegular) {
        return finalToRegular[letter];
    } else {
        return letter;
    }
}

function setTile(letter) {
    if (currCol < ROW_SIZE) {
        const nextTile = document.getElementById(`${getCurrCell()}`);
        nextTile.textContent = convertLetter(letter);
        nextTile.classList.add('set_animation');
        nextTile.style.borderColor = "#565758";
        currWord.push(nextTile.textContent);
        currCol++;
    }

}

function clearTile() {
    const prevCell = getCurrCell() - 1;
    if (prevCell < 0 || currCol === 0) {
        return;
    }
    const currTile = document.getElementById(`${prevCell}`);
    currTile.classList.remove('set_animation');
    currTile.style.removeProperty('border-color')
    currTile.textContent = "";
    currWord.pop();
    if (currCol > 0) {
        currCol--;
    }

}

function isValidWord(word) {
    if (word.length !== ROW_SIZE) {
        showModal(modal, 'המילה קצרה מדי');
        return false;
    }
    if (!words.includes(word)) {
        showModal(modal, 'לא מילה חוקית');
        for (let i = 0; i < 5; ++i) {
            document.getElementById(5 * currRow + i).classList.add('shake');
        }
        sleep(300).then(() => {
            for (let i = 0; i < 5; ++i) {
                document.getElementById(5 * currRow + i).classList.remove('shake');
            }
        })
        return false;
    }
    return true;
}

const timer = ms => new Promise(res => setTimeout(res, ms))

async function handleKeyEvent(event) {
    let pressedKey = (event instanceof KeyboardEvent) ? event.key : event.target.dataset.key;
    if (!pressedKey.search('[אבגדהוזחטיכלמנסעפצקרשתםףךןץ]')) {
        setTile(pressedKey);
    } else if (pressedKey === 'Backspace' || pressedKey === 'Delete') {
        clearTile();
    } else if (pressedKey === 'Enter') {
        const currTry = currWord.join('');
        if (isValidWord(currTry)) {
            const [results, correct] = checkWord(currTry);
            for (let i = 0; i < results.length; ++i) {
                const letterCell = document.getElementById(`${(5 * currRow) + i}`);
                letterCell.classList.remove('set_animation');
                letterCell.classList.add('flip');
                const currLetter = currTry[i] in finalToRegular ? finalToRegular[currTry[i]] : currTry[i];
                letterCell.classList.add(results[i]);
                document.querySelector(`[data-key='${currLetter}']`).classList.add(results[i]);
                resultString += resultToImg[results[i]];
                await timer(500);
            }
            resultString += '\n';
            currWord = [];
            currCol = 0;
            currRow++;
            if (correct) {
                await timer(500);
                endModal.classList.remove('hidden');
                endModalBack.classList.remove('hidden');
                endModalText.textContent =
                    ` וורדל ${word_index}\n` +
                    `נסיון  ${currRow} מתוך 6 `;
                document.querySelector('.end-modal-imgs').textContent = resultString;
                document.removeEventListener("keydown", handleKeyEvent)
            } else if (currRow === 6) {
                await timer(500);
                endModal.classList.remove('hidden');
                endModalBack.classList.remove('hidden');
                endModalText.textContent =
                    ` וורדל ${word_index}\n` +
                    ` המילה הנכונה היא ${solution}` + '\n';
                document.querySelector('.end-modal-imgs').textContent = resultString;

            }
        }
    } else {
        showModal(modal, "ניתן להכניס אותיות בעברית בלבד.");
    }
}

function convertToReg(letter) {
    return finalToRegular[letter] || letter;
}

// check word
function checkWord(word) {
    const solutionHistogram = createHistogram(solution);
    let correct = true;
    const results = Array(5);
    // find correct
    for (let i = 0; i < word.length; ++i) {
        const currLetter = convertToReg(word[i]);

        if (currLetter === convertToReg(solution[i])) {
            results[i] = 'correct';
            solutionHistogram[currLetter]--;
        }
    }
    for (let i = 0; i < word.length; ++i) {
        const currLetter = convertToReg(word[i]);
        if (results[i] !== 'correct') {
            if (solutionHistogram[currLetter] > 0) {
                correct = false;
                results[i] = 'present';
                solutionHistogram[currLetter]--;
            } else {
                correct = false;
                results[i] = 'absent';
            }
        }
    }
    return [results, correct];

}


function setRandomIndex() {
    const parser = new URL(window.location);
    parser.searchParams.set('word', String(Math.floor((Math.random()) * nouns.length)));
    window.location = parser.href;
}

// Keyboard
keyBoardButtons.forEach((btn) => {
    btn.addEventListener('click', handleKeyEvent)
})

document.addEventListener('keydown', handleKeyEvent);