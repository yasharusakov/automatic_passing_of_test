# To use this project follow these steps

**Works only with firefox browser!** <br>
**And remmeber, every step of this instruction is important!**

#### Download driver for firefox
  * Arch/Manjaro
    - `$ sudo pacman -S geckodriver`


#### To Install all packages use `npm i` or `npm install` in terminal

### Create a .env file with these fiels
* API_KEY=`YOUR API KEY`
  * Your api key you can find there https://platform.openai.com/account/api-keys

### Download Tor network
* Arch/Manjaro
  - `$ sudo pacman -S tor`

Open terminal and input: 
- `vi /etc/tor/torrc`

### Write it there: <br>

```
SocksPort 9050
SocksPort 9052 
SocksPort 9053 
SocksPort 9054
```

#### In terminal input sudo tor
#### To start app input `npm start` in terminal