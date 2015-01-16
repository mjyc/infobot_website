'''ROS Action server wrapper.
'''

# ######################################################################
# Imports
# ######################################################################

# System-builtins
import signal
import sys

# ROS
import actionlib
import rospy


# ######################################################################
# Classes
# ######################################################################

class SimplerActionServer:

    def __init__(self, actionname, actionmsg):
        # Register sigint handler.
        signal.signal(signal.SIGINT, self.sigint_handler)

        # Start SimpleActionServer.
        self._as = actionlib.SimpleActionServer(
            actionname, actionmsg, auto_start=False)
        self._as.register_goal_callback(self.goal_cb)
        self._as.register_preempt_callback(self.preempt_cb)
        self._as.start()

        self._update_cb = None

    def set_update_db(self, update_cb):
        self._update_cb = update_cb

    def sigint_handler(self, signal, frame):
        print("\n(Server) You pressed Ctrl+C! aborting the goal and exit.")
        self.abort()
        rospy.signal_shutdown("Done!")
        sys.exit(0)

    def goal_cb(self):
        print("\n(Server) Update: Accepting new goal!")
        self._as.accept_new_goal()
        if self._update_cb:
            self._update_cb()

    def preempt_cb(self):
        if self._as.is_active():
            print("\n(Server) Update: Preempting current goal!")
            self._as.set_preempted()
        if self._update_cb:
            self._update_cb()

    def preempt(self, result=None):
        print("(Server) Preempting.")
        if self._as.is_active():
            self._as.set_preempted(result)
        else:
            print("(Server) There is no active goal. Not preempting.")

    def abort(self, result=None):
        print("(Server) Aborting.")
        if self._as.is_active():
            self._as.set_aborted(result)
        else:
            print("(Server) There is no active goal. Not aborting.")

    def succeed(self, result=None):
        print("(Server) Succeeding.")
        if self._as.is_active():
            self._as.set_succeeded(result)
        else:
            print("(Server) There is no active goal. Not succeeding.")
