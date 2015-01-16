'''Test functions for "schedule_queryjob" service.
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
from sara_uw_website.msg import RunQueryAction
from sara_uw_website.srv import ScheduleQueryJob
from sara_uw_website.simpler_action_server import SimplerActionServer
from testutils import (
    generate_uniq_objectid,
    random_unix_epoch,
)


# ######################################################################
# Functions
# ######################################################################

def test_valid_resp_n_db(self):
    ''' Only tests calling the service with valid inputs. Checks
    service responses and DB state. For DB state, checks if required
    fields were created as expected and has expected values.
    '''

    # Create a SimpleActionServer.
    rospy.init_node("test_sara_uw_website")
    SimplerActionServer(
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

    # Check number of documents in DB.
    self.assertTrue(self._collection.find().count(), N)

    # Check results.
    for i in range(len(test_inputs)):
        test_input = test_inputs[i]
        resp = resps[i]

        # Check response variable.
        self.assertTrue(resp.success)

        # Check DB state.
        query = {
            "_id": test_input["queryjob_id"],
            "timeissued": {"$exists": True},
            "order": {"$exists": True},
            "timestarted": {"$exists": True},
            "timecompleted": {"$exists": True},
            "status": {"$exists": True}
        }
        qr = self._collection.find(query)
        self.assertEqual(qr.count(), 1)
        # Only test value of the input "timeissued" in DB.
        self.assertEqual(
            qr[0]["timeissued"].replace(tzinfo=utc), test_input["timeissued"])


def test_valid_multiple(self):
    ''' Testing calling many services with the same QueryId. Expects
    the service to overwrite the previous requests if the scheduler
    is still in RECEIVED status.
    '''

    # Create a SimpleActionServer.
    rospy.init_node("test_sara_uw_website")
    SimplerActionServer(
        "/run_query", RunQueryAction)

    # Wait for the service to start.
    rospy.wait_for_service("/schedule_queryjob")
    s = rospy.ServiceProxy("/schedule_queryjob", ScheduleQueryJob)

    # Create test instances but let them have the same ObjectId.
    queryjob_id = generate_uniq_objectid(self._collection)
    self._collection.insert({"_id": queryjob_id})
    # Duplicating
    N = 50
    test_inputs = []
    for i in range(N):
        timeissued_int = random_unix_epoch()
        timeissued = dt.utcfromtimestamp(timeissued_int).replace(tzinfo=utc)
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
    qr = self._collection.find()
    self.assertTrue(qr.count(), 1)

    # Check if the last service was successful.
    self.assertEqual(
        qr[0]["timeissued"].replace(tzinfo=utc), test_inputs[-1]["timeissued"])
