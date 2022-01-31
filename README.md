# Chat-Uol-Backend

Now you can have your own room chat app. Make your front-end and be happy with this back-end of Chat Uol

<p align="center">
  <img src="./chat-uol-usage.gif" alt="trackit-usage.gif" height="540" />
</p>

## About

This repository contains the code for your own app based on Uol Chat. Whit it you are allowed to run a server on your PC.

### Implemented features

- Log in a participant
- Send a normal message
- Send a private message
- Remove inactive user

## Technologies
The following tools and frameworks were used in the construction of the project:<br>

  [![wakatime](https://wakatime.com/badge/user/75b063fd-fc90-4981-92ec-8042466ed674/project/ad71c2d0-aa7e-4b11-80a5-a23e8c1029ff.svg)](https://wakatime.com/@vitorcarneiro/projects/utphnbpogn?start=2022-01-23&end=2022-01-29)

  ![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)

<p>
  <img style='margin: 5px;' src='https://img.shields.io/badge/back-end%20-%2320232a.svg?&style=flat&color=informational'> 
  <img style='margin: 5px;' src='https://img.shields.io/badge/express%20-%2320232a.svg?&style=flat&color=informational'>
  <img style='margin: 5px;' src='https://img.shields.io/badge/cors%20-%2320232a.svg?&style=flat&color=informational'>
  <img style='margin: 5px;' src='https://img.shields.io/badge/joi%20-%2320232a.svg?&style=flat&color=informational'>
  <img style='margin: 5px;' src='https://img.shields.io/badge/dayjs%20-%2320232a.svg?&style=flat&color=informational'>
</p>

## How to run

0. Befora all, it is necessary to run mongodb on your machine and set your MONGO_URI on .env file


1. Clone this repository
2. Install dependencies
```bash
npm i
```
4. Run the front-end with
```bash
npm start
```
5. You can optionally build the project running
```bash
npm run build
```
6. Finally, using your own front-end, you can resquest for http://localhost:5000 all data.