document.addEventListener('DOMContentLoaded', async function () {
    const apiUrl = 'https://pokeapi.co/api/v2/pokemon/';
    let playerTeamData;
    let opponentTeamData;
    let currentPlayerPokemon;
    let currentOpponentPokemon;
    let isPlayerTurn = false;
    let battleLog;

    function getRandomNumber(max) {
        return Math.floor(Math.random() * max) + 1;
    }

    async function fetchData(url) {
        const response = await fetch(url);
        return response.json();
    }

    async function getPokemonData(pokemonId) {
        const data = await fetchData(`${apiUrl}${pokemonId}`);
        const levelUpMoves = data.moves.filter(move => {
            return move.version_group_details.some(versionGroup => {
                return versionGroup.move_learn_method.name === 'level-up';
            });
        });

        const randomMoves = [];
        while (randomMoves.length < 4) {
            const randomMoveIndex = getRandomNumber(levelUpMoves.length) - 1;
            const move = levelUpMoves[randomMoveIndex].move.name;

            if (!randomMoves.includes(move)) {
                randomMoves.push(move);
            }
        }

        return {
            name: data.name,
            image: data.sprites.front_default,
            moves: randomMoves,
            health: 100,
        };
    }

    function createPokemonElement(pokemon, container) {
        const pokemonElement = document.createElement('div');
        pokemonElement.classList.add('pokemon');
        const typesHTML = pokemon.types ? `<p><strong>Type(s):</strong> ${pokemon.types.join(', ')}</p>` : '';
        const movesHTML = pokemon.moves.map((move, index) => `<div class="move ${index % 2 === 0 ? 'even' : 'odd'}"><p><strong>Move:</strong> ${move}</p></div>`).join('');

        pokemonElement.innerHTML = `
            <div class="pokemon-header">
                <h2>${pokemon.name}</h2>
                <img src="${pokemon.image}" alt="${pokemon.name}" />
            </div>
            <div class="pokemon-details">
                ${typesHTML}
                <div class="moves-container">
                    ${movesHTML}
                </div>
                <p><strong>Health:</strong> ${pokemon.health}</p>
            </div>
        `;

        container.appendChild(pokemonElement);

        pokemonElement.addEventListener('click', function () {
            if (isPlayerTurn && pokemon !== currentPlayerPokemon) {
                switchPokemon(pokemon);
            }
        });
    }

    async function createPokemonTeam(container, teamSize) {
        const team = [];
        for (let i = 0; i < teamSize; i++) {
            const randomPokemonId = getRandomNumber(1010);
            const pokemon = await getPokemonData(randomPokemonId);
            createPokemonElement(pokemon, container);
            team.push(pokemon);
        }
        return team;
    }

    window.startBattle = async function () {
        const playerTeamContainer = document.getElementById('player-team');
        const opponentTeamContainer = document.getElementById('opponent-team');
        battleLog = document.getElementById('battle-log');
        const battleField = document.getElementById('battle-field');
        const playerPokemonContainer = document.getElementById('player-pokemon');
        const opponentPokemonContainer = document.getElementById('opponent-pokemon');
        const startButton = document.getElementById('start-battle');
        const attackButton = document.getElementById('attack-btn');

        playerTeamContainer.innerHTML = '';
        opponentTeamContainer.innerHTML = '';
        battleLog.innerHTML = '';
        battleField.style.display = 'none';

        playerTeamData = await createPokemonTeam(playerTeamContainer, 6);
        opponentTeamData = await createPokemonTeam(opponentTeamContainer, 6);

        currentPlayerPokemon = playerTeamData[0];
        currentOpponentPokemon = opponentTeamData[0];

        battleLog.innerHTML = `Battle started! ${currentPlayerPokemon.name} vs. ${currentOpponentPokemon.name}`;
        updatePokemonHealth(playerTeamData, playerTeamContainer);
        updatePokemonHealth(opponentTeamData, opponentTeamContainer);

        playerPokemonContainer.innerHTML = '';
        opponentPokemonContainer.innerHTML = '';
        createPokemonElement(currentPlayerPokemon, playerPokemonContainer);
        createPokemonElement(currentOpponentPokemon, opponentPokemonContainer);

        battleField.style.display = 'flex';
        startButton.style.display = 'none';
        attackButton.style.display = 'block';
        attackButton.style.margin = 'auto';
        isPlayerTurn = true;
    };

    window.chooseMove = function () {
        if (!isPlayerTurn) {
            return;
        }

        if (currentPlayerPokemon.health <= 0) {
            battleLog.innerHTML += `<p>${currentPlayerPokemon.name} has fainted and cannot attack!</p>`;
            setTimeout(opponentTurn, 1000);
            return;
        }

        const playerMove = prompt('Choose a move: ' + currentPlayerPokemon.moves.join(', '));

        if (currentPlayerPokemon.moves.includes(playerMove)) {
            const isCriticalHit = Math.random() < 0.1;
            const isMiss = Math.random() < 0.25;
            let attackDamage;

            if (isMiss) {
                battleLog.innerHTML += `<p>${currentPlayerPokemon.name}'s attack missed!</p>`;
            } else {
                attackDamage = isCriticalHit ? Math.floor(Math.random() * 40) + 1 : Math.floor(Math.random() * 20) + 1;

                currentOpponentPokemon.health -= attackDamage;

                if (currentOpponentPokemon.health <= 0) {
                    currentOpponentPokemon.health = 0;
                    battleLog.innerHTML += `<p>${currentPlayerPokemon.name} dealt ${attackDamage} damage (Critical Hit!) to ${currentOpponentPokemon.name}. ${currentOpponentPokemon.name} fainted!</p>`;

                    const opponentIndex = opponentTeamData.indexOf(currentOpponentPokemon);
                    if (opponentIndex !== -1) {
                        opponentTeamData.splice(opponentIndex, 1);
                    }

                    currentOpponentPokemon = opponentTeamData.shift();

                    if (!currentOpponentPokemon) {
                        battleLog.innerHTML += `<p>Congratulations! You defeated all opponent Pokémon!</p>`;
                        document.getElementById('attack-btn').style.display = 'none';
                        return;
                    }

                    battleLog.innerHTML += `<p>New opponent: ${currentOpponentPokemon.name}</p>`;
                } else {
                    battleLog.innerHTML += `<p>${currentPlayerPokemon.name} dealt ${attackDamage} damage${isCriticalHit ? ' (Critical Hit)' : ''} to ${currentOpponentPokemon.name}. ${currentOpponentPokemon.name} has ${currentOpponentPokemon.health} health remaining.</p>`;
                }
            }

            currentPlayerPokemon.health = Math.max(currentPlayerPokemon.health, 0);

            setTimeout(opponentTurn, 1000);
        } else {
            alert('Invalid move! Please choose a valid move.');
        }
    };

    function opponentTurn() {
        if (currentPlayerPokemon.health <= 0) {
            currentPlayerPokemon.health = 0;
            battleLog.innerHTML += `<p>${currentPlayerPokemon.name} has fainted and cannot attack!</p>`;
            updatePokemonHealth(playerTeamData, document.getElementById('player-team'));
            setTimeout(() => switchToNextPokemon(playerTeamData), 1000);
            return;
        }

        const opponentMoveIndex = Math.floor(Math.random() * currentOpponentPokemon.moves.length);
        const opponentMove = currentOpponentPokemon.moves[opponentMoveIndex];
        const isCriticalHit = Math.random() < 0.1;
        const isMiss = Math.random() < 0.25;
        let opponentAttackDamage;

        if (isMiss) {
            battleLog.innerHTML += `<p>${currentOpponentPokemon.name}'s attack missed!</p>`;
        } else {
            opponentAttackDamage = isCriticalHit ? Math.floor(Math.random() * 40) + 1 : Math.floor(Math.random() * 20) + 1;

            currentPlayerPokemon.health -= opponentAttackDamage;

            if (currentPlayerPokemon.health <= 0) {
                currentPlayerPokemon.health = 0;
                battleLog.innerHTML += `<p>${currentOpponentPokemon.name} dealt ${opponentAttackDamage} damage${isCriticalHit ? ' (Critical Hit)' : ''} to ${currentPlayerPokemon.name}. ${currentPlayerPokemon.name} fainted!</p>`;

                const playerIndex = playerTeamData.indexOf(currentPlayerPokemon);
                if (playerIndex !== -1) {
                    playerTeamData.splice(playerIndex, 1);
                }

                currentPlayerPokemon = playerTeamData.shift();

                if (!currentPlayerPokemon) {
                    battleLog.innerHTML += `<p>Game over! All your Pokémon fainted.</p>`;
                    document.getElementById('attack-btn').style.display = 'none';
                    return;
                }
                battleLog.innerHTML += `<p>New player Pokémon: ${currentPlayerPokemon.name}</p>`;
            } else {
                battleLog.innerHTML += `<p>${currentOpponentPokemon.name} dealt ${opponentAttackDamage} damage${isCriticalHit ? ' (Critical Hit)' : ''} to ${currentPlayerPokemon.name}. ${currentPlayerPokemon.name} has ${currentPlayerPokemon.health} health remaining.</p>`;
            }
        }

        updatePokemonHealth(playerTeamData, document.getElementById('player-team'));
        updatePokemonHealth(opponentTeamData, document.getElementById('opponent-team'));
        updatePokemonHealth([currentPlayerPokemon], document.getElementById('player-pokemon'));
        updatePokemonHealth([currentOpponentPokemon], document.getElementById('opponent-pokemon'));

        isPlayerTurn = true;
    }


    window.switchPokemon = function () {
        if (!isPlayerTurn) {
            return;
        }

        playerTeamData = playerTeamData.filter(pokemon => pokemon !== currentPlayerPokemon);
        playerTeamData.push(currentPlayerPokemon);

        currentPlayerPokemon = playerTeamData.find(pokemon => !pokemon.inBattle);

        updatePokemonHealth(playerTeamData, document.getElementById('player-team'));
        document.getElementById('player-pokemon').innerHTML = '';
        createPokemonElement(currentPlayerPokemon, document.getElementById('player-pokemon'));

        battleLog.innerHTML += `<p>${currentPlayerPokemon.name} is now in battle!</p>`;
    };

    function updatePokemonHealth(team, container) {
        container.innerHTML = '';
        team.forEach(pokemon => {
            pokemon.inBattle = pokemon === currentPlayerPokemon;
            createPokemonElement(pokemon, container);
        });
    }
});