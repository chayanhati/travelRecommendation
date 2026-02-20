document.addEventListener("DOMContentLoaded", function () {
    const resultDiv = document.getElementById("recommendation-result");
    const searchInput = document.getElementById("search-input");
    const searchBtn = document.getElementById("search-btn");
    const clearBtn = document.getElementById("reset-btn");

    let dataReady = false;
    let dataByType = {
        beach: [],
        temple: [],
        country: []
    };

    const countryTimeZones = {
        Australia: "Australia/Sydney",
        Japan: "Asia/Tokyo",
        Brazil: "America/Sao_Paulo",
        Cambodia: "Asia/Phnom_Penh",
        India: "Asia/Kolkata",
        "French Polynesia": "Pacific/Tahiti"
    };

    function getCountryFromName(text) {
        if (!text || typeof text !== "string") {
            return "";
        }
        const parts = text.split(",");
        if (parts.length < 2) {
            return "";
        }
        return parts[parts.length - 1].trim();
    }

    function getLocalDateTime(country) {
        const tz = countryTimeZones[country];
        if (!tz) {
            return "";
        }

        return new Date().toLocaleString("en-US", {
            timeZone: tz,
            year: "numeric",
            month: "short",
            day: "numeric",
            hour12: true,
            hour: "numeric",
            minute: "numeric",
            second: "numeric"
        });
    }

    function normalizeData(raw) {
        const normalized = {
            beach: [],
            temple: [],
            country: []
        };

        if (Array.isArray(raw.countries)) {
            raw.countries.forEach(function (country) {
                if (!Array.isArray(country.cities)) {
                    return;
                }

                country.cities.forEach(function (city) {
                    normalized.country.push({
                        name: city.name,
                        imageUrl: city.imageUrl,
                        description: city.description,
                        country: country.name
                    });
                });
            });
        }

        if (Array.isArray(raw.temples)) {
            raw.temples.forEach(function (item) {
                normalized.temple.push({
                    name: item.name,
                    imageUrl: item.imageUrl,
                    description: item.description,
                    country: getCountryFromName(item.name)
                });
            });
        }

        if (Array.isArray(raw.beaches)) {
            raw.beaches.forEach(function (item) {
                normalized.beach.push({
                    name: item.name,
                    imageUrl: item.imageUrl,
                    description: item.description,
                    country: getCountryFromName(item.name)
                });
            });
        }

        return normalized;
    }

    function renderResults(items, keyword) {
        if (!resultDiv) {
            return;
        }

        if (!items || items.length === 0) {
            resultDiv.innerHTML = "<p>No results found.</p>";
            return;
        }

        const cards = items.map(function (item) {
            const localDateTime = getLocalDateTime(item.country);
            return (
                '<article class="card">' +
                    '<img src="' + item.imageUrl + '" alt="' + item.name + '">' +
                    '<div class="card-body">' +
                        '<h3>' + item.name + '</h3>' +
                        '<p><strong>Description:</strong> ' + item.description + '</p>' +
                        (item.country ? '<p><strong>Country:</strong> ' + item.country + '</p>' : '') +
                        (localDateTime ? '<p><strong>Local Date & Time:</strong> ' + localDateTime + '</p>' : '') +
                    '</div>' +
                '</article>'
            );
        }).join("");

        resultDiv.innerHTML =
            "<h2>Results for: " + keyword + "</h2>" +
            '<div class="result-grid">' + cards + "</div>";
    }

    function getKeyword(value) {
        const text = value.trim().toLowerCase().replace(/[.,!?]/g, "");
        if (text === "beach" || text === "beaches") {
            return "beach";
        }
        if (text === "temple" || text === "temples") {
            return "temple";
        }
        if (text === "country" || text === "countries") {
            return "country";
        }
        return "";
    }

    function clearResults() {
        if (searchInput) {
            searchInput.value = "";
        }
        if (resultDiv) {
            resultDiv.innerHTML = "";
        }
    }

    fetch("travel_recommendation_api.json")
        .then(function (response) {
            if (!response.ok) {
                throw new Error("Could not load JSON data.");
            }
            return response.json();
        })
        .then(function (rawData) {
            dataByType = normalizeData(rawData);
            dataReady = true;
            console.log("Recommendation data loaded:", dataByType);
        })
        .catch(function (error) {
            console.error(error);
            if (resultDiv) {
                resultDiv.innerHTML = "<p>Error loading recommendation data.</p>";
            }
        });

    if (searchBtn && searchInput) {
        searchBtn.addEventListener("click", function () {
            if (!dataReady) {
                resultDiv.innerHTML = "<p>Data is still loading. Try again.</p>";
                return;
            }

            const keyword = getKeyword(searchInput.value);
            if (!keyword) {
                resultDiv.innerHTML =
                    "<p>Please use one of these keywords: beach, beaches, temple, temples, country, countries.</p>";
                return;
            }

            renderResults(dataByType[keyword], keyword);
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener("click", clearResults);
    }
});
