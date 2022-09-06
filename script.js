// Information Modal
const infoBtn = document.querySelector('.info__btn')
const infoModal = document.querySelector('.modal__info')
const infoModalBlur = document.querySelector('.bg__blur')
const closeInfoModalBtn = document.querySelector('.close__modal__info__btn')

infoBtn.addEventListener('click', () => infoModalVisibility(true))
closeInfoModalBtn.addEventListener('click', () => infoModalVisibility(false))
infoModalBlur.addEventListener('click', () => infoModalVisibility(false))

function infoModalVisibility(visibility){
  visibility 
    ? infoModal.classList.remove('d-none')
    : infoModal.classList.add('d-none')
}

// Game
const home = document.querySelector('.home')
const gameStarted = document.querySelector('.game__started')
const optionsWrapper = document.querySelector('.guess__options')
const gameFinished = document.querySelector('.game__finished')
const newGameBtn = document.querySelector('.new__game__btn')

let allCountries = null;

const actualGame = {
  mode: '',
  totalCountriesToGuess: 0,
  countriesGuessed: 0,
  randomCountriesSelected: []
}

const regions = [
  'Africa',
  'Americas',
  'Asia',
  'Europe',
  'Oceania'
]

// Select a game mode
const gameModeBtns = document.querySelector('.game__modes').querySelectorAll('button')

for(const gmBtn of gameModeBtns) {
  gmBtn.addEventListener('click', () => {
    startGame(gmBtn.getAttribute('data-game-mode'))
  })
}

// Start new game when ending one
newGameBtn.addEventListener('click', function(){
  gameFinished.classList.add('d-none')
  home.classList.remove('d-none')
})

// Start game
async function startGame(mode){

  if(!allCountries) await getCountries();

  actualGame.mode = mode
  actualGame.countriesGuessed = 0

  // Get random countries
  actualGame.totalCountriesToGuess = Number(document.querySelector('#quantity').value)
  actualGame.randomCountriesSelected = await getRandomValues(actualGame.totalCountriesToGuess, allCountries)

  home.classList.add('d-none')
  gameStarted.classList.remove('d-none')
  
  document.querySelector('.game__mode').textContent = `By ${mode}`
  document.querySelector('.guessed').textContent = 'Guessed: 0'

  await startGuessingCountry(0)
}

async function startGuessingCountry(countryIndex){

  const { mode, totalCountriesToGuess, randomCountriesSelected } = actualGame

  if(countryIndex + 1 > totalCountriesToGuess){
    finishGame()
    return
  }

  const countryToGuess = randomCountriesSelected[countryIndex]

  // Update visible content
  document.querySelector('.counter').textContent = `${countryIndex + 1}/${totalCountriesToGuess}`
  document.querySelector('.country__img').src = countryToGuess.flag

  // Get other 3 random values and push in randmon index the current country or region to guess
  const random = await getRandomValues(3, (mode == 'name') ? allCountries : regions, countryToGuess)

  const randomIndex = Math.trunc(Math.random() * 4)
  random.splice(randomIndex, 0, (mode == 'name') ? countryToGuess : countryToGuess.region)

  // Show buttons options and clear the previous ones
  optionsWrapper.innerHTML = ''

  // r could be: region name or country object
  random.forEach( r => {
      const button = document.createElement('button')

      button.textContent = (mode == 'name') ? r.name : r

      const correctAnswer = (mode == 'name') ? countryToGuess.name : countryToGuess.region

      button.addEventListener('click', (e) => guessResult(e.target, correctAnswer, countryIndex))

      optionsWrapper.insertAdjacentElement('beforeend', button)
  })
}

function finishGame(){

  gameFinished.classList.remove('d-none')
  gameStarted.classList.add('d-none')

  const gamesPlayed = JSON.parse(localStorage.getItem('gamesPlayed')) ?? []

  const { mode, totalCountriesToGuess, countriesGuessed } = actualGame

  const winRatio = countriesGuessed * 100 / totalCountriesToGuess

  gamesPlayed.unshift({ mode, totalCountriesToGuess, countriesGuessed, winRatio })

  // Maintain always 6 sets stored
  if(gamesPlayed.length === 7) gamesPlayed.pop()

  // If the table is not replaced by its initial value (see index.html), 
  // the sets displayed will be duplicated when inserted again in the forEach below
  const table = gameFinished.querySelector('table')
  table.innerHTML =`
    <tr>
      <th>Game mode</th>
      <th>Countries to guess</th>
      <th>Successful</th>
      <th>Percent</th>
    </tr>
  `

  gamesPlayed.forEach( g => {
    const tr = document.createElement('tr')
    tr.innerHTML = `
      <tr>
        <td>By ${g.mode}</td>
        <td>${g.totalCountriesToGuess}</td>
        <td>${g.countriesGuessed}</td>
        <td class="${g.winRatio >= 50 ? 'success' : 'error'}">${(Math.round(g.winRatio * 100) / 100).toFixed(2)}%</td>
      <tr>
    `
    table.insertAdjacentElement('beforeend', tr)
  })

  localStorage.setItem('gamesPlayed', JSON.stringify(gamesPlayed))
}

function guessResult(btnSelected, correctAnswer, guessingCountryIndex){

  const success = btnSelected.textContent === correctAnswer
  
  const optionBtns = document.querySelector('.guess__options').querySelectorAll('button')

  // Show good answer. If the selected button is the correct one, 
  // then it is assigned the success class in the forEach
  btnSelected.classList.add('error')

  optionBtns.forEach( btn => {
    btn.setAttribute('disabled', '')
    if(btn.textContent === correctAnswer) btn.classList.add('success')
  })
  
  // Update total of countries guessed if the guess is correct
  if(success){
    actualGame.countriesGuessed++
    document.querySelector('.guessed').textContent = `Guessed: ${actualGame.countriesGuessed}`
  } else {
    btnSelected.classList += ' animate__animated animate__shakeX'
  }
  
  // Start guessing next country
  setTimeout(() => {
    startGuessingCountry(guessingCountryIndex + 1)
  }, 2500);
}

async function getCountries(){
  const data = await fetch('https://restcountries.com/v3.1/all?fields=name,region,flags')
  const countriesData = await data.json()

  allCountries = countriesData.map( ({name, flags, region}) => {
    return {
      name: name.common,
      flag: flags.png,
      region
    }
  })
}

// Get random values (countries or regions)
function getRandomValues(total = 10, arr, exception){

  let randomValues = []

  let arrCopy = [...arr]

  // if typeof is string, means that it is by region
  if(exception && typeof arrCopy[0] === 'string'){
    arrCopy = arrCopy.filter(c => c !== exception.region)
  } else if(exception) {
    arrCopy = arrCopy.filter(c => c.name !== exception.name)
  }

  // To obtain random countries without repeating them
  // we need to create a copy of the allContries array and delete the countries selected as we do below
  for(let i = 0; i < total; i++){
    const randomIndex = Math.trunc(Math.random() * arrCopy.length - 1)
    randomValues.push(arrCopy[randomIndex])
    arrCopy.splice(randomIndex, 1)
  }

  return randomValues
}