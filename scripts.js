const topSpace = document.querySelector('.top-space');
const deckContainer = document.querySelector('.deck-container');
const bottomSpace = document.querySelector('.bottom-space');
const leftSpace = document.querySelector('.left-space');
const rightSpace = document.querySelector('.right-space');
const btnShuffle = document.querySelector('.shuffle-deal-btn');
const btnPlay = document.querySelector('.play-btn');
const labelTop = document.querySelector('.label-top');
const labelBottom = document.querySelector('.label-bottom');

// Flip the card on click
document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', function () {
        this.classList.toggle('is-flipped');
    })
});

// Ensure all cards are shown face down initially
document.querySelectorAll('.card').forEach(card => {
    card.classList.add('is-flipped');
});

// Helper functions for Shuffle button async function
// Update the label with the card count
const updateLabelWithCount = (label, count) => {
    label.textContent = '';
    label.textContent = `${count} cards`;
};

// Count cards in a given space
const countCardsInSpace = async (space) => {
    return space.querySelectorAll('.card').length;
};

// Update card counts and labels
const updateCardCounts = async () => {
    const topCount = await countCardsInSpace(topSpace);
    const bottomCount = await countCardsInSpace(bottomSpace);

    updateLabelWithCount(labelTop, topCount);
    updateLabelWithCount(labelBottom, bottomCount);
};

// Deal cards to a space
const dealCardsToSpaces = (cards, space) => {
    cards.forEach(card => {
        space.appendChild(card);
    })
};

// Shuffle the deck
const shuffleDeck = async cards => {
    return cards.sort(() => 0.5 - Math.random());
};

// Handle the Shuffle button click event
const shuffleAndDealCards = async () => {
    // Disable Shuffle button
    disableBtn(btnShuffle);
    // Enable Play button
    enableBtn(btnPlay);

    const deck = document.getElementById('deck');

    // Simulate shuffling
    const shuffledCards = await shuffleDeck(Array.from(deck.children));

    // Move half to the top space and half to the bottom space
    const halfway = Math.ceil(shuffledCards.length / 2);
    dealCardsToSpaces(shuffledCards.slice(0, halfway), topSpace);
    dealCardsToSpaces(shuffledCards.slice(halfway), bottomSpace);

    // Count the cards in the top and bottom spaces
    await updateCardCounts();
};

// ******************************************************************** //

// Async arrow function to handle the play button click event
const handlePlayButtonClick = async () => {
    // Disable Play button
    await disableBtn(btnPlay);

    // Get the top card from each space
    const topCard = getTopCard(topSpace);
    const bottomCard = getTopCard(bottomSpace);

    if (topCard && bottomCard) {
        // Move the top card from the top space to the left space
        moveCardToSpace(topCard, leftSpace);
        // Move the top card from the bottom space to the right space
        moveCardToSpace(bottomCard, rightSpace);
    };

    // Flip both cards
    await flipCard(topCard);
    await flipCard(bottomCard);

    await sleep(1500);

    // Compare the ranks and determine the winner
    await handleCardComparison(topCard, bottomCard, topSpace, bottomSpace, rightSpace, leftSpace);
    
    // Update the card counts in the top and bottom spaces
    await updateCardCounts();

    // Check for winner after each play
    await checkForWinner(topSpace, bottomSpace);

    // Re-enable the Play button
    await enableBtn(btnPlay);
};

// Helper functions for Play button async function
// Move all cards from a space back to the deck
const moveAllCardsToDeck = (space, deckContainer) => {
    while (space.firstChild) {
        deckContainer.appendChild(space.firstChild);
    }
};

// Move all cards from a space back to the deck
const moveAllCardsToWinner = (space, winnerSpace) => {
    while (space.firstChild) {
        winnerSpace.appendChild(space.firstChild);
    }
};

// Reset the game to the initial state
const resetGame = async () => {
    const deckContainer = document.querySelector('.deck-container');

    // Move all cards from the top space back to the deck
    moveAllCardsToDeck(topSpace, deckContainer);

    // Move all cards from the bottom space back to the deck
    moveAllCardsToDeck(bottomSpace, deckContainer);

    // Move all cards from the left space back to the deck
    moveAllCardsToDeck(leftSpace, deckContainer);

    // Move all cards from the right space back to the deck
    moveAllCardsToDeck(rightSpace, deckContainer);

    // Shuffle the deck and deal the cards again
    await shuffleAndDealCards();

    // Re-enable buttons, etc.
    enableBtn(btnShuffle);
    disableBtn(btnPlay);
};

// Handle end of the game
const endGame = async (winner) => {
    console.log(`${winner} space wins the game!`);

    // Reset the game
    await resetGame();
};

// Check for a winner
const checkForWinner = async (topSpace, bottomSpace) => {
    let topCount = await countCardsInSpace(topSpace);
    let bottomCount = await countCardsInSpace(bottomSpace);

    if (topCount === 0 || bottomCount === 0) {
        let winner;

        if (topCount === 0 && bottomCount > 0) {
            winner = 'Bottom';
        } else if (bottomCount === 0 && topCount > 0) {
            winner = 'Top';
        };
        await endGame(winner);
    };
};

// Move tie cards to the winner's space
const moveTieCardsToWinner = async (winnerSpace, rightSpace, leftSpace, topTieCards, bottomTieCards) => {
    const allTieCards = [...topTieCards, ...bottomTieCards];
    for (const card of allTieCards) {
        winnerSpace.insertBefore(card, winnerSpace.firstChild);
    };
    winnerSpace.insertBefore(rightSpace.lastChild, winnerSpace.firstChild);
    winnerSpace.insertBefore(leftSpace.lastChild, winnerSpace.firstChild);
};

// Display tie cards
const displayTieCards = (rightSpace, leftSpace, topTieCards, bottomTieCards) => {
    for (let i = 0; i < 3; i++) {
        leftSpace.appendChild(topTieCards[i]);
        rightSpace.appendChild(bottomTieCards[i]);
    };
    leftSpace.appendChild(topTieCards[topTieCards.length -1]);
    rightSpace.appendChild(bottomTieCards[bottomTieCards.length -1]);
};

// Prepare tie cards
const prepareTieCards = async (topSpace, bottomSpace, topTieCards, bottomTieCards) => {
    topTieCards = [];
    bottomTieCards = [];
    const allTieCards = [];
    
    for (let i = 0; i < 4; i++) {
        const topCard = topSpace.querySelector('.card:last-child');
        const bottomCard = bottomSpace.querySelector('.card:last-child');

        // Remove the cards from their original spaces
        topSpace.removeChild(topCard);
        bottomSpace.removeChild(bottomCard);

        // Move the cards to the tie piles (arrays)
        topTieCards.push(topCard);
        bottomTieCards.push(bottomCard);

        // Wait a bit before moving the next card
        await sleep(500);
    };
    return { topTieCards, bottomTieCards };
};

// Check if there are enough cards to handle a tie
const hasEnoughCardsForTie = (topSpace, bottomSpace) => {
    return topSpace.children.length >= 4 && bottomSpace.children.length >= 4;
};

// Main function to handle tie situation
const handleTie = async (topSpace, bottomSpace, rightSpace, leftSpace) => {
    let isTie = true;

    while (isTie) {
        // Check if there are enough cards to handle a tie
        if (!hasEnoughCardsForTie(topSpace, bottomSpace)) {
            let topCount = await countCardsInSpace(topSpace);
            let bottomCount = await countCardsInSpace(bottomSpace);
            let winner;

            if (topCount > bottomCount) {
                winner = 'Top';
            } else {
                winner = 'Bottom'
            };
            console.log('Not enough cards to resolve the tie. Game over!');
            
            // TODO: Maybe missing a return
            endGame(winner); // Exit the loop if there are not enough cards
        };

        // Take four cards from each space and handle the tie
        await prepareTieCards(topSpace, bottomSpace, topTieCards, bottomTieCards);

        // Move the fourth cards (face-up) to left and right spaces for comparison
        displayTieCards(rightSpace, leftSpace, topTieCards, bottomTieCards);

        // Flip the last (fourth) cards face-up for comparison
        flipCard(topTieCards[topTieCards.length -1]);
        flipCard(bottomTieCards[bottomTieCards.length -1]);

        await sleep(1500)

        // Compare the cards and determine the winner
        const result = compareCardRanks(topTieCards[3], bottomTieCards[3]);

        // Flip back the firsts cards and the last ones
        flipCard(topTieCards[topTieCards.length -1]);
        flipCard(bottomTieCards[topTieCards.length -1]);

        if (result === 1) {
            console.log('Top space wins the tie!');
            await moveTieCardsToWinner(topSpace, rightSpace, leftSpace, topTieCards, bottomTieCards);
            isTie = false;  // Exit the loop since we have a winner
        } else if (result === -1) {
            console.log('Bottom space wins the tie!');
            await moveTieCardsToWinner(bottomSpace, rightSpace, leftSpace, topTieCards, bottomTieCards);
            isTie = false;  // Exit the loop since we have a winner
        } else {
            console.log('Another tie occurred! Repeating the process.');
            // Continue the loop to handle another tie
        };
        // Update the card counts
        await updateCardCounts();
    };
};

// Move cards to the winner's space
const moveCardsToWinner = async (winnerSpace, rightSpace, leftSpace) => {
    winnerSpace.insertBefore(rightSpace.lastChild, winnerSpace.firstChild);
    winnerSpace.insertBefore(leftSpace.lastChild, winnerSpace.firstChild);
};

// Compare card ranks
const compareCardRanks = (card1, card2) => {
    const rankOrder = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

    const card1Rank = card1.querySelector('.rank').textContent.trim();
    const card2Rank = card2.querySelector('.rank').textContent.trim();

    const card1Value = rankOrder.indexOf(card1Rank);
    const card2Value = rankOrder.indexOf(card2Rank);

    if (card1Value > card2Value) {
        return 1; // topCard wins
    } else if (card1Value < card2Value) {
        return -1; // bottomCard wins
    } else {
        return 0; // It's a tie
    };
};

// Main function to compare the ranks and determine the winner
const handleCardComparison = async (topCard, bottomCard, topSpace, bottomSpace, rightSpace, leftSpace) => {
    const result = compareCardRanks(topCard, bottomCard);

    if (result === 1) {
        console.log('Top space wins!');
        // Flip them back
        await flipCard(topCard);
        await flipCard(bottomCard);
        await moveCardsToWinner(topSpace, rightSpace, leftSpace);
    } else if (result === -1) {
        console.log('Bottom space wins!');
        // Flip them back
        await flipCard(topCard);
        await flipCard(bottomCard);
        await moveCardsToWinner(bottomSpace, rightSpace, leftSpace);
    } else {
        console.log('It\'s a tie!');
        await handleTie(topSpace, bottomSpace, rightSpace, leftSpace);
        // Flip them back
        await flipCard(topCard);
        await flipCard(bottomCard);
    };
};

const flipCard = async (card) => {
    card.classList.toggle('is-flipped');
};

const moveCardToSpace = (card, space) => {
    space.appendChild(card);
};

const getTopCard = (space) => {
    return space.lastChild;
};

function sleep(ms) {
    return new Promise(f => setTimeout(f, ms))
};

async function disableBtn(btn) {
    btn.disabled = true;
};

async function enableBtn(btn) {
    btn.disabled = false;
};

//disableBtn(btnPlay)

//resetGame();

// Async arrow function attached to the Shuffle button click event
btnShuffle.addEventListener('click', shuffleAndDealCards);

// Async arrow function attached to the Play button click event
btnPlay.addEventListener('click', handlePlayButtonClick);
