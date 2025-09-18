window.onscroll = function () {
    myFunction()

    var scrollToTopBtn = document.getElementById("scrollToTopBtn");
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        scrollToTopBtn.style.display = "block";
    } else {
        scrollToTopBtn.style.display = "none";
    }
};

var header = document.querySelector("nav");
var sticky = header.offsetTop;

function myFunction() {
    if (window.pageYOffset > sticky) {
        header.classList.add("sticky");
    } else {
        header.classList.remove("sticky");
    }
}

async function getAllPokemonData() {
    try {
        const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1010');
        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error('Fout bij het ophalen van Pokémon-gegevens:', error);
        return [];
    }
}

async function getPokemonData(url) {
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Fout bij het ophalen van individuele Pokémon-gegevens:', error);
        return null;
    }
}

async function displayAllPokemonData() {
    const pokedexDiv = document.getElementById('pokedex');

    try {
        // Fetch all Pokemon data
        const allPokemon = await getAllPokemonData();

        for (const pokemon of allPokemon) {
            // Fetch details for each Pokemon
            const pokemonDetails = await getPokemonData(pokemon.url);

            const pokemonName = pokemonDetails.name;
            const pokemonImage = pokemonDetails.sprites.front_default;
            const pokemonTypes = pokemonDetails.types.map(type => {
                const typeName = type.type.name;
                const typeImage = `/code/img/types/${typeName}.svg`;
                return `<div class="icon ${typeName}"><img src="${typeImage}" alt="pokemon-type"></div>`;
            }).join(' ');

            // Create a Pokemon element
            const pokemonElement = document.createElement('div');
            pokemonElement.classList.add('pokemon-container');

            pokemonElement.innerHTML = `
                <h2>${pokemonName}</h2>
                <img src="${pokemonImage}" alt="${pokemonName}" />
                <div class="icons">${pokemonTypes}</div>
                <button class="info-button" onclick="showAdditionalInfoOffcanvas('${pokemon.url}', this)">Show Info</button>
            `;

            pokedexDiv.appendChild(pokemonElement);
        }

    } catch (error) {
        console.error('Error displaying all Pokemon data:', error);
    }
}

async function showAdditionalInfoOffcanvas(pokemonUrl, buttonElement) {
    try {
        const pokemonDetails = await getPokemonData(pokemonUrl);

        const offcanvas = document.createElement('div');
        offcanvas.classList.add('offcanvas');

        let offcanvasContent = '';

        if (pokemonDetails.types && Array.isArray(pokemonDetails.types)) {
            const typesWithImages = pokemonDetails.types.map(type => {
                const typeName = type.type.name;
                const typeImage = `/code/img/types/${typeName}.svg`;
                return `<img src="${typeImage}" alt="${typeName}" class="pokemon-type"> ${typeName}`;
            }).join(' ');

            offcanvasContent += `<p><strong>Types:</strong> ${typesWithImages}</p>`;
        }

        for (const property in pokemonDetails) {
            if (
                pokemonDetails.hasOwnProperty(property) &&
                property !== 'moves' &&
                property !== 'game_indices' &&
                property !== 'past_abilities' &&
                property !== 'abilities' &&
                property !== 'past_types' &&
                property !== 'sprites' &&
                property !== 'types' &&
                property !== 'held_items'
            ) {
                let value = pokemonDetails[property];

                if (typeof value === 'object') {
                    if (Array.isArray(value)) {
                        value = value.map(obj => stringifyObject(obj)).join(', ');
                    } else {
                        value = stringifyObject(value);
                    }
                }

                offcanvasContent += `<p><strong>${property}:</strong> ${value}</p>`;
            }
        }

        offcanvas.innerHTML = `
            <div class="offcanvas-content">
                <button class="close-btn" onclick="closeOffcanvas()">Close</button>
                ${offcanvasContent}
            </div>
        `;

        document.body.appendChild(offcanvas);

        // 👉 Active class pas toevoegen na reflow
        requestAnimationFrame(() => {
            offcanvas.classList.add("active");
        });

        // Klik buiten de box sluit hem ook
        window.addEventListener('click', function (event) {
            if (event.target === offcanvas) {
                closeOffcanvas();
            }
        });

    } catch (error) {
        console.error('Error fetching additional info:', error);
    }
}

function closeOffcanvas() {
    const offcanvas = document.querySelector('.offcanvas');
    if (offcanvas) {
        offcanvas.classList.remove("active");
        // wacht tot animatie klaar is voordat element verdwijnt
        setTimeout(() => offcanvas.remove(), 100);
    }
}

function stringifyObject(obj) {
    return Object.entries(obj).map(([key, value]) => `${key}: ${value}`).join(', ');
}

function searchPokemon(inputId) {
    const searchTerm = document.getElementById(inputId).value.toLowerCase();
    const pokemonContainers = document.querySelectorAll('.pokemon-container');

    pokemonContainers.forEach(container => {
        const pokemonName = container.querySelector('h2').textContent.toLowerCase();

        if (pokemonName.startsWith(searchTerm)) {
            container.style.display = 'block';
        } else {
            container.style.display = 'none';
        }
    });
}

// Functie om naar boven te scrollen
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Roep de functie aan om alle Pokémon weer te geven bij het laden van de pagina
displayAllPokemonData();