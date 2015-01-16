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

# Local
from sara_uw_website.msg import QueryJob, RunQueryAction
from sara_uw_website.srv import CancelQueryJob, ScheduleQueryJob
from sara_uw_website.simpler_action_server import SimplerActionServer
from testutils import random_unix_epoch


# ######################################################################
# Functions
# ######################################################################

def test_valid_cancel(self):
    ''' Checks the response and DB states before and after calling
    the service.
        Note: this test can be split to two parts.
    '''

    # Create a SimpleActionServer.
    rospy.init_node("test_sara_uw_website")
    server = SimplerActionServer(
        "/run_query", RunQueryAction)

    # Wait for the service to start
    rospy.wait_for_service("/cancel_queryjob")
    c = rospy.ServiceProxy("/cancel_queryjob", CancelQueryJob)
    rospy.wait_for_service("/schedule_queryjob")
    s = rospy.ServiceProxy("/schedule_queryjob", ScheduleQueryJob)

    # Create test instances.
    N = 50  # MUST BE DIVISIBLE BY 2
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

    # Check number of documents in DB.
    self.assertTrue(self._collection.find().count(), N)

    # Call service Part1: before QueryJobs are running.
    for i in range(N / 2):
        test_input = test_inputs.pop()
        resp = c(test_input["queryjob_id_str"])

        # Check response variable.
        self.assertTrue(resp.success)

        # Check DB state.
        query = {
            "_id": test_input["queryjob_id"],
            # Must be created (or modified).
            "timecompleted": {"$exists": True}
        }
        qr = self._collection.find(query)
        self.assertEqual(qr.count(), 1)
        self.assertEqual(qr[0]["status"], QueryJob.STATUS_CANCELLED)
        self.assertEqual(
            qr[0]["timeissued"].replace(tzinfo=utc), test_input["timeissued"])

    # Start controlling action server.
    r = rospy.Rate(10)
    i = 0
    while True:
        if i == (N / 2):
            break
        if not server._as.is_active():
            r.sleep()
            continue

        test_input = test_inputs[i]

        # Call service Part2: after QueryJobs are running.
        print "Canceling test_input {0}".format(
            test_input["queryjob_id_str"])
        resp = c(test_input["queryjob_id_str"])
        self.assertTrue(resp.success)

        # Check DB state.
        query = {
            "_id": test_input["queryjob_id"],
            # Must be created (or modified).
            "timecompleted": {"$exists": True}
        }
        qr = self._collection.find(query)
        self.assertEqual(qr.count(), 1)
        self.assertEqual(qr[0]["status"], QueryJob.STATUS_CANCELLED)
        self.assertEqual(
            qr[0]["timeissued"].replace(tzinfo=utc), test_input["timeissued"])
        i += 1
