#!/usr/bin/env python

from sara_uw_website.srv import *
import rospy

def handle_parse_question(req):
    parsed_cmd = req.typed_cmd + " parsed!"
    return ParseQuestionResponse(parsed_cmd)

def parse_question_server():
    rospy.init_node('parse_question_server')
    rospy.Service('parse_question', ParseQuestion, handle_parse_question)
    print "Ready to parse question."
    rospy.spin()

if __name__ == "__main__":
    parse_question_server()
