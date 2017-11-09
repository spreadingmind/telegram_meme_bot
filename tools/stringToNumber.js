module.exports = (string) => {
    if (!string) {
        return 0;
    }

    let int = parseInt(string, 10);

    if (Number.isNaN(int)) {
        return 0;
    }

    return int;
};
