cmake_minimum_required(VERSION 2.8.3)
project(sara_uw_website)

## Find catkin macros and libraries
## if COMPONENTS list like find_package(catkin REQUIRED COMPONENTS)
## is used, also find other catkin packages
find_package(catkin REQUIRED COMPONENTS
  actionlib
  actionlib_msgs
  message_generation
  rospy
  std_msgs
)

catkin_python_setup()

################################################
## Declare ROS messages, services and actions ##
################################################

add_message_files(
 FILES
 QueryJob.msg
 Result.msg
 User.msg
)

add_service_files(DIRECTORY srv
  FILES
  # queryjob_server_node
  CancelQueryJob.srv
  # question_parser_node
  ParseQuestion.srv
)

add_action_files(DIRECTORY action
  FILES
  RunQuery.action
)

generate_messages(DEPENDENCIES actionlib_msgs std_msgs)

###################################
## catkin specific configuration ##
###################################
catkin_package(
 CATKIN_DEPENDS actionlib_msgs message_runtime std_msgs
)

#############
## Testing ##
#############

if(CATKIN_ENABLE_TESTING)
  find_package(catkin COMPONENTS rostest)

  add_rostest(test/test_queryjob_server.test)
endif()
