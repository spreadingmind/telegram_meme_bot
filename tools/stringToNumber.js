module.exports = (string) => {
    if (!string) {
        return 0;
    }

    let int = parseInt(string);

    if (isNaN(int)) {
        return 0;
    }

    return int;
};