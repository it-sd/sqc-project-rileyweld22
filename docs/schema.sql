\encoding UTF8

DROP TABLE IF EXISTS profile;
DROP TABLE IF EXISTS chart;
DROP TABLE IF EXISTS tune_chart;

CREATE TABLE profile (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    password TEXT NOT NULL
);

CREATE TABLE chart (
    id SERIAL PRIMARY KEY,
    profile_id INTEGER NOT NULL,
    number INTEGER NOT NULL,
    name TEXT NOT NULL,
    time TIMESTAMP WITH TIME ZONE NOT NULL,
    creator TEXT NOT NULL
);

CREATE TABLE tune_chart (
    id SERIAL PRIMARY KEY,
    chart_id INTEGER NOT NULL,
    number INTEGER NOT NULL,
    name TEXT NOT NULL,
    artist TEXT NOT NULL,
    album TEXT NOT NULL,
    length INTEGER NOT NULL,
    cover TEXT NULL
);

INSERT INTO tune_chart (chart_id, number, name, artist, album, length)
    values
 (1, 1, 'Woods', 'Mac Miller', 'Circles', 286),
 (1, 2, 'THE zone~', 'Lil Yachty', 'Let''s Start Here.', 249);