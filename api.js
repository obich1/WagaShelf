// Searches AniList and returns an array of matching titles
async function searchAniList(searchText) {

    // 1. WHERE to send the request
    const url = "https://graphql.anilist.co";

    // 2. WHAT data we want back (written in GraphQL, AniList's language)
    const query = `
        query ($search: String) {
            Page(perPage: 5) {
                media(search: $search) {
                    id
                    title { romaji english }
                    type
                    format
                    countryOfOrigin
                    coverImage { medium }
                    averageScore
                    genres

                }
            }
        }
    `;

    // 3. The BODY: the query, plus the value to fill into $search
    const requestBody = {
        query: query,
        variables: { search: searchText }
    };

    // 4. The full request: method + headers + body
    const options = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
    };

    // 5. SEND it, and wait for the reply
    const response = await fetch(url, options);

    // 6. READ the reply: turn the JSON text into an object
    const data = await response.json();

    // 7. Return just the array of results, not the whole wrapper
    const results = data.data.Page.media;
    return results;

}
function getMediaType(media){
    if(media.type === "ANIME") return "Anime";
    if(media.format === "NOVEL") return "Novel";
    if(media.countryOfOrigin === "KR") return "Manhwa";
    if(media.countryOfOrigin === "CN") return "Manhua";
    return "Manga";
}
