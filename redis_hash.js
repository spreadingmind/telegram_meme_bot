const redisClient = require('redis').createClient(process.env.REDIS_URL);

sources = {
    'facebook': {
        'Dankrecoverymemes': 100,
        'Memes.fr': 100,
        'MemesLas24Horas': 100,
        'PlaceForMemes': 100,
        'livingnightmares': 100,
        'memes': 100,
        'top10memesoftheweek': 100
    },
    'reddit': {
        'FreshMemes': 100,
        'MemeEconomy': 100,
        'funny': 100,
        'heprotecbutalsoattac': 100,
        'lol': 100,
        'memes': 100,
        'wholesomememes': 100
    },
    'twitter': {
        'chuck_facts': 100,
        'freememeskids': 100,
        'memecenter': 100,
        'memesonhistory': 100,
        'ohwonka': 100,
        'runetmemes': 100
    },
    'vk': {
        '-25089415': 100,
        '-31480508': 100,
        '-35182135': 100,
        '-45745333': 100,
        '-92337511': 100,
        '-131489096': 100,
        '-143197468': 100,
        '-111920468': 100,
        '-145473661': 100,
        '-149905440': 100,
        '-50177168': 100,
        '-124374483': 100,
        '-149919976': 100,
        '-32041317': 100,
    }
};


function addExistingSources() {
    for (var key in sources) {
        redisClient.hmset(key, sources[key])
    }
}

//run once to add in new channel
addExistingSources();