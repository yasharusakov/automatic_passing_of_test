# What is it
We shall not tell... yet)

___
# Installing

## Windows: *not yet... probably*
## Mac OS: *never*

## Arch/Manjaro:
```
sudo pacman -S geckodriver
```

## Debian Ubuntu Linux mint: *not yet... probably*

## Installing packages
In root project's write this:
```
npm i
```
or 
```
npm install
```
## Set up Chat-GPT3 job

### Create a '.env' file in root project's and write there:
```
API_KEY=`YOUR API KEY`
```
Your api key you can find there https://platform.openai.com/account/api-keys
If you've registered there.

## Set up support Tor 

### Download Tor network

#### Windows: *not yet... probably*

#### Debian Ubuntu Linux Mint: *not yet... probably*

#### Arch/Manjaro:
```
sudo pacman -S tor
```

Open terminal, launch this command `vi /etc/tor/torrc` and write it in there:
```
SocksPort 9050
SocksPort 9052
SocksPort 9053
SocksPort 9054
```
___
# Usage

## Run program:
```
npm start
```

## Run program with Tor:
Open two terminals, in one of them launch: `sudo tor`, in second: 
```
npm run tor
```
___
## Appendix
[**Authors**](./Authors)

[**License**](./LICENSE)
