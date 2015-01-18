'''Test execution functionality in query_scheulder node.
'''

# ######################################################################
# Imports
# ######################################################################

# System built-ins
import datetime
dt = datetime.datetime
from pytz import utc

# ROS
import rospy
import random

# Local
from sara_uw_website.msg import QueryJob, RunQueryAction
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

    # Create test instances.
    N = 50
    timeissued_ints = []
    for i in range(N):
        timeissued_ints.append(random_unix_epoch())
    timeissued_ints.sort()
    test_inputs = []
    # extend test_inputs with queryjob_id fields
    for timeissued_int in timeissued_ints:
        timeissued = dt.utcfromtimestamp(timeissued_int).replace(tzinfo=utc)
        deadline = timeissued + \
            datetime.timedelta(minutes=10)
        queryjob_id = self._collection.insert({
            "timeissued": timeissued,
            "typed_cmd": str(i),  # dummy
            "notification_sms": False,  # dummy
            "notification_email": False,  # dummy
            "is_public": False,  # dummy
            "deadline": deadline,  # dummy
            "user": {  # dummy
                "_id": "",
                "name": "",
                "email": "",
            },  # dummy
            "status": QueryJob.STATUS_RECEIVED,
            "order": None,
            "timestarted": None,
            "timecompleted": None,
            "result": None
        })
        test_inputs.append({
            "timeissued": timeissued,
            "timeissued_int": timeissued_int,
            "queryjob_id": queryjob_id,
            "queryjob_id_str": str(queryjob_id)
        })

    # Check number of documents in DB.
    self.assertEqual(self._collection.find().count(), N)

    # Start controlling action server.
    r = rospy.Rate(5)
    i = 0
    while True:
        if i == N:
            break
        if not server._as.is_active():
            r.sleep()
            continue

        test_input = test_inputs[i]

        # DB state check after the goal is accepted.
        type(test_input["queryjob_id"])
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
            self.assertEqual(qr[0]["status"], QueryJob.STATUS_CANCELED)
        elif a == "a":
            self.assertEqual(qr[0]["status"], QueryJob.STATUS_FAILED)

        i += 1
