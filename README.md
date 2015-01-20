# sara_uw_website

## Installing Dependencies

#### MongoDB

See [MongoDB Website](http://docs.mongodb.org/manual/installation/) for details.

#### On Ubuntu 14.04

Do not copy and paste below code, but actual

```
# install node--note that you can use any version > v0.10.32
if [ ! -d ~/code ]; then mkdir -p ~/local/src; fi;
cd ~/local/src
git clone https://github.com/joyent/node.git
cd node
git checkout tags/v0.10.32
./configure --prefix=~/local
make; make install
# make sure to add ~/local/bin to $PATH
# e.g., echo 'export PATH=~/local/bin:$PATH' >> ~/.bashrc

# install canvas
sudo apt-get install libcairo2-dev libjpeg8-dev libpango1.0-dev libgif-dev build-essential g++
sudo apt-get install libgif-dev
cd ~/path/to/sara_uw_website
npm install canvas

# install node dependencies
npm install
npm install bson
npm install -g grunt-cli  # grunt is like makefile for node
npm install -g nodemon  # for debugging
npm install -g node-inspector  # for debugging

# install web components
npm install -g bower
bower install

# install sendemail (not included in rosdistro yet) for scripts/keyboard_run_query_server or will use python-based sendemail library in future.
sudo apt-get install sendemail
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

# install web components
npm install -g bower
bower install
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
roslaunch launch/webserver.launch
```

On second terminal, run

```
cd ~/path/to/sara_uw_website
node bin/www
```

## Nodes

### queryjob_server_node

This node is a ROS server that supplements the Node.js webserver (e.g., server.js). This node accesses the database directly, makes modification and publishes updates using ROS topic. Specifically, once proper queryjob instances are created by the Node.js webserver, this node (1) scans DB to check if there are any queryjob instances that can be run, (2) schedules the found instances in FIFO manner, (3) runs them using the ROS action client API, and (4) provides a ROS service for canceling a running queryjob. Note that you can use `scripts/create_queryjob` script to create a queryjob DB instance without running the Node.js webserver, and you can use `scripts/keyboard_run_query_server` to launch keyboard based fake (e.g., no real robot running) ROS action server.

#### Action API

##### Action Subscribed Topics

* `run_query/result` (sara_uw_website/RunQueryActionResult)
  * Monitor result from the robot-side executor.

##### Action Published Topics

* `run_query/goal` (sara_uw_website/RunQueryActionGoal)
  * Sends goals to the robot-side executor.
* `run_query/cancel` (actionlib_msgs/GoalID)
  * Sends cancel requests to the robot-side executor.

#### Published Topics

* `queryjob` (sara_uw_website/QueryJob)
  * Updated queryjob wrapped in ROS msg.

#### Services

* `cancel_queryjob` (sara_uw_website/CancelQueryJob)
  * Cancel service can be called at any stage of scheduling.

### question_parser_node

TBA
