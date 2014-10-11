# sara_uw_website

## Installing Dependencies

#### On Ubuntu 14.04

Do not copy and paste below code, but actual

```
# install node--note that we are installing it from source to use a particular version of node
if [ ! -d ~/code ]; then mkdir -p ~/local/src; fi;
cd ~/local/src
git clone https://github.com/joyent/node.git
cd node
git checkout tags/v0.10.32
./configure --prefix=~/local
make; make install

# install canvas
cd ~/path/to/sara_uw_website
sudo apt-get install libcairo2-dev libjpeg8-dev libpango1.0-dev libgif-dev build-essential g++
sudo apt-get install libgif-dev

# install node dependencies
npm install
npm install bson
npm install -g grunt-cli  # grunt is like makefile for node
npm install -g node-inspector  # for debugging
```

#### On Mac OS X 10.9

First make sure ROS is prepared for running the website server. See [this wiki](https://github.com/pronobis/sara/wiki/Draft-of-Installation-Instructions-for-Mac-OS-X-10.9) for setting ROS on Mac OS X.

```
# install canvas
cd ~/path/to/sara_uw_website
export PKG_CONFIG_PATH=/usr/local/lib/pkgconfig:/opt/X11/lib/pkgconfig
npm install canvas

# install node dependencies
npm install  # install node dependencies
npm install bson
npm install -g grunt-cli  # grunt is like makefile for node
npm install -g node-inspector  # for debugging
```

## Running Website Server

#### Using [Grunt](http://gruntjs.com/)

```
cd ~/path/to/sara_uw_website
grunt
```

#### Without Using Grunt

On first terminal, run

```
cd ~/path/to/sara_uw_website
roslaunch launch/run_rosnodes.launch
```

On second terminal, run

```
cd ~/path/to/sara_uw_website
node bin/www
```

## Database Models

see the [database model doc on google drive](https://docs.google.com/document/d/15Mvr-qWT-urHocsiDXLwXAtiwZ0kJiqtb0C6rsN1Soo/edit?usp=sharing) for details.
