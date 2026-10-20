// Searches AniList and returns an array of matching titles
async function searchAniList(searchText) {


    const url = "https://graphql.anilist.co";


    const query = `
        query ($search: String) {
            Page(perPage: 5) {
                media(search: $search) {
                    id
                    title { romaji english }
                    type
                    chapters
                    episodes
                    format
                    countryOfOrigin
                    coverImage { medium }
                    averageScore
                    genres

                }
            }
        }
    `;

    const requestBody = {
        query: query,
        variables: { search: searchText }
    };

    const options = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
    };

    const response = await fetch(url, options);

    if (!response.ok) {
        throw new Error(`AniList returned status ${response.status}`);
    }

    const data = await response.json();

    if (data.errors) {
        throw new Error(data.errors[0].message);
    }

    const results = data.data.Page.media;
    return results;

}
function getMediaType(media){
    if(media.type === "ANIME") return "Anime";
    if(media.format === "NOVEL") return "Novel";
    if(media.countryOfOrigin === "KR") return "Manhwa";
    if(media.countryOfOrigin === "CN") return "Manhua";
    return "Manga";
};

function getProgressNo(media){
    const isOneEpisode = media.episodes === 1;
    const isOneChapter = media.chapters === 1;
    if(getMediaType(media) === "Anime" && media.episodes !== null) return isOneEpisode ? `${media.episodes} Episode` : `${media.episodes} Episodes`;
    if(getMediaType(media) !== "Anime" && media.chapters != null) return isOneChapter ? `${media.chapters} Chapter` : `${media.chapters} Chapters`;
    return "TBD";
};
