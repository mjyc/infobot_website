'''Test execution functionality in query_scheulder node.
'''

# ######################################################################
# Imports
# ######################################################################

# System built-ins
from datetime import datetime as dt
from pytz import utc

# ROS
import rospy
import random

# Local
from sara_uw_website.msg import QueryJob, RunQueryAction
from sara_uw_website.srv import ScheduleQueryJob
from sara_uw_website.simpler_action_server import SimplerActionServer
from testutils import random_unix_epoch


# ######################################################################
# Functions
# ######################################################################

def test_valid_execution(self):
    '''Tests DB states while running FIFO style scheduling based on
    "timeissued" field. Uses a SimpleActionServer to respond to
    scheduler's SimpleActionClient requests.
    '''

    # Create a SimpleActionServer.
    rospy.init_node("test_sara_uw_website")
    server = SimplerActionServer(
        "/run_query", RunQueryAction)

    # Wait for the service to start.
    rospy.wait_for_service("/schedule_queryjob")
    s = rospy.ServiceProxy("/schedule_queryjob", ScheduleQueryJob)

    # Create test instances.
    N = 50
    test_inputs = []
    for i in range(N):
        timeissued_int = random_unix_epoch()
        timeissued = dt.utcfromtimestamp(timeissued_int).replace(tzinfo=utc)
        queryjob_id = self._collection.insert({"dummy": None})
        test_inputs.append({
            "queryjob_id": queryjob_id,
            "queryjob_id_str": str(queryjob_id),
            "timeissued": timeissued,
            "timeissued_int": timeissued_int
        })
    # Assume QueryJobs are created in order of "timeissued".
    test_inputs.sort(key=lambda x: x["timeissued"])

    # Call service.
    resps = []
    for test_input in test_inputs:
        resp = s(
            test_input["queryjob_id_str"], test_input["timeissued_int"])
        resps.append(resp)
        self.assertTrue(resp.success)

    # Check number of documents in DB.
    self.assertEqual(self._collection.find().count(), N)

    # Start controlling action server.
    r = rospy.Rate(10)
    i = 0
    while True:
        if i == N:
            break
        if not server._as.is_active():
            r.sleep()
            continue

        test_input = test_inputs[i]

        # DB state check after the goal is accepted.
        qr = self._collection.find({
            "_id": test_input["queryjob_id"],
            "order": {"$exists": True}  # could be renewed to 1
        })
        self.assertEqual(qr.count(), 1)
        self.assertEqual(
            qr[0]["timeissued"].replace(tzinfo=utc), test_input["timeissued"])
        self.assertEqual(qr[0]["status"], QueryJob.STATUS_RUNNING)

        a = random.choice(["s", "p", "a"])
        if a == "s":
            server.succeed()
        elif a == "p":
            server.preempt()
        elif a == "a":
            server.abort()
        r.sleep()  # wait until client updates DB
        # should get notified by topic in future.

        # DB state check when done action.
        qr = self._collection.find({
            "_id": test_input["queryjob_id"],
            "order": {"$exists": True}  # could be renewed to 1
        })
        self.assertEqual(qr.count(), 1)
        self.assertEqual(
            qr[0]["timeissued"].replace(tzinfo=utc), test_input["timeissued"])
        if a == "s":
            self.assertEqual(qr[0]["status"], QueryJob.STATUS_SUCCEEDED)
        elif a == "p":
            self.assertEqual(qr[0]["status"], QueryJob.STATUS_CANCELLED)
        elif a == "a":
            self.assertEqual(qr[0]["status"], QueryJob.STATUS_FAILED)

        i += 1
