cmake_minimum_required(VERSION 2.8.3)
project(sara_uw_website)

## Find catkin macros and libraries
## if COMPONENTS list like find_package(catkin REQUIRED COMPONENTS)
## is used, also find other catkin packages
find_package(catkin REQUIRED COMPONENTS
  message_generation
  rospy
  std_msgs
)

################################################
## Declare ROS messages, services and actions ##
################################################
add_service_files(DIRECTORY srv
  FILES
  ParseQuestion.srv
)

generate_messages(DEPENDENCIES message_runtime std_msgs)

###################################
## catkin specific configuration ##
###################################
catkin_package(
 CATKIN_DEPENDS message_runtime std_msgs
)
