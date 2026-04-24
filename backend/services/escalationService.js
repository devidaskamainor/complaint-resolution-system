// ==========================================
// AUTO-ESCALATION SERVICE
// ==========================================

const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { sendEscalationEmail } = require('../middleware/emailService');

/**
 * Auto-escalate complaints that are older than 3 days
 */
async function autoEscalateComplaints() {
    console.log('🔄 Running auto-escalation check...');

    try {
        const threeDaysAgo = new Date();
        threeDaysAgo.setHours(threeDaysAgo.getHours() - 72); // 72 hours = 3 days

        // Find complaints that need escalation
        const complaintsToEscalate = await Complaint.find({
            status: { $in: ['pending', 'in_progress', 'approved'] },
            lastStatusUpdate: { $lt: threeDaysAgo },
            level: { $lt: 3 } // Not already at max level
        });

        if (complaintsToEscalate.length === 0) {
            console.log('✅ No complaints need escalation');
            return;
        }

        console.log(`⚠️  Found ${complaintsToEscalate.length} complaints to escalate`);

        for (const complaint of complaintsToEscalate) {
            try {
                const oldLevel = complaint.level;
                const newLevel = oldLevel + 1;

                // Update complaint
                complaint.level = newLevel;
                complaint.status = 'escalated';
                complaint.lastStatusUpdate = new Date();

                // Add to escalation history
                complaint.escalationHistory.push({
                    fromLevel: oldLevel,
                    toLevel: newLevel,
                    reason: 'Auto-escalated due to 3-day timeout without resolution',
                    escalatedBy: 'system',
                    timestamp: new Date()
                });

                // Add timeline entry
                const levelNames = {
                    1: 'Officer',
                    2: 'Senior Officer',
                    3: 'Department Head'
                };

                complaint.timeline.push({
                    status: 'escalated',
                    timestamp: new Date(),
                    note: `Auto-escalated from Level ${oldLevel} to Level ${newLevel} (${levelNames[newLevel]})`,
                    updatedBy: 'system'
                });

                // Add notification
                complaint.notifications.push({
                    type: 'escalation',
                    message: `Your complaint has been escalated to Level ${newLevel} (${levelNames[newLevel]})`,
                    timestamp: new Date(),
                    read: false
                });

                await complaint.save();

                // Find officer at new level (for now, just notify - assignment logic can be enhanced)
                const officer = await User.findOne({
                    role: 'officer',
                    department: complaint.category,
                    isActive: true
                });

                if (officer) {
                    complaint.assignedTo = officer.name;
                    await complaint.save();
                }

                // Send email notification to citizen
                await sendEscalationEmail(
                    complaint.email,
                    complaint.id,
                    complaint.title,
                    oldLevel,
                    newLevel
                );

                console.log(`✅ Escalated complaint ${complaint.id} from Level ${oldLevel} to Level ${newLevel}`);

                // Deduct points from previous officer if assigned
                if (complaint.assignedTo && oldLevel > 1) {
                    const prevOfficer = await User.findOne({ name: complaint.assignedTo, role: 'officer' });
                    if (prevOfficer) {
                        prevOfficer.totalPoints = Math.max(0, prevOfficer.totalPoints - 3);
                        await prevOfficer.save();
                    }
                }

            } catch (error) {
                console.error(`❌ Failed to escalate complaint ${complaint.id}:`, error.message);
            }
        }

        console.log('✅ Auto-escalation check completed');

    } catch (error) {
        console.error('❌ Auto-escalation service error:', error);
    }
}

module.exports = {
    autoEscalateComplaints
};
