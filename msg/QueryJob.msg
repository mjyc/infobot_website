# Modified from Node.js
string id                # ROS msg can't have name _id
time timeissued          # a timestamp created when a user issued a query.
string typed_cmd         # a raw command typed by a user.
bool notification_sms    # a boolean indicating sms notification is desired.
bool notification_email  # a boolean indicating email notification is desired.
bool is_public           # a boolean indicating privacy status.
time deadline            # a desired query deadline timestamp.

# Modified from ROS
uint8 status             # can take one of the following values.
uint64 order              # a scheduling output in integer. Lower number means sooner the job will be executed (1 is the lowest order).
time timestarted         # a timestamp created when a ROS goal representing a single QueryJob is sent.
time timecompleted       # a timestamp created when a result of the ROS goal is received.
sara_uw_website/Result result  # result returned from the robot.


# Constants
uint8 STATUS_RECEIVED = 0   # assigned after a service request is received.
uint8 STATUS_SCHEDULED = 1  # assigned after the scheduling is done.
uint8 STATUS_RUNNING = 2    # assigned right before sending an ROS action goal.
uint8 STATUS_SUCCEEDED = 3  # assigned when a returned result has "SUCCEEDED" state.
uint8 STATUS_CANCELLED = 4  # assigned when a returned result has "PREEMPTED" state.
uint8 STATUS_FAILED = 5     # are assigned when a returned result has other state.
