# 🚀 Subix LeadOS v2.0

**Modern CRM for Real Estate & Lead Management**

A beautiful, fast, and powerful lead management system built with vanilla JavaScript, HTML, and CSS.

---

## 📖 Quick Start

### Run the App
```bash
npx -y serve ./app
```
Open: `http://localhost:3000`

### First Time Users
- App auto-generates 15 sample leads on first load
- All data stored in browser localStorage
- No backend needed!

---

## ✨ Features

### Phase 1: Core Foundation ✅
- **Dashboard** - KPIs, charts, recent activity
- **Lead Management** - Create, view, edit, delete leads
- **Kanban Pipeline** - Drag & drop lead status
- **Data Persistence** - localStorage database
- **Lead Scoring** - Automatic scoring algorithm
- **Bulk Actions** - Select & update multiple leads

### Phase 2: Intelligence ✅  
- **Lead Detail Modal** - 360° lead view with tabs
- **Quick Actions** - Call, WhatsApp, Email from cards
- **Notes Management** - Add & view notes
- **Follow-up Scheduler** - Schedule & track follow-ups
- **Activity Timeline** - Complete interaction history
- **Pipeline Enhancements**:
  - Contact info on cards
  - High-value badges (₹50L+)
  - Overdue indicators
  - Quick status change button (no dragging!)

---

## 🎯 Key Improvements

### Dashboard
- ✅ Auto-seed dummy data on first load
- ✅ Clickable notifications → Navigate to sections
- ✅ View All button → Goes to Leads
- ✅ Clean UI (removed dev buttons)

### Pipeline
- ✅ Enhanced cards with full contact info
- ✅ 5 quick action buttons per card
- ✅ Visual indicators (high-value, overdue)
- ✅ Quick status change dropdown (no dragging!)
- ✅ Smooth hover animations
- ✅ Both drag & drop AND quick change work

---

## 🎨 Tech Stack

**Frontend**:
- Vanilla JavaScript (ES6+)
- HTML5
- CSS3 (Glassmorphism, Dark Theme)
- Material Icons

**Data**:
- localStorage (client-side database)
- JSON data structure

**No Dependencies** - Pure vanilla code!

---

## 📂 Project Structure

```
Lead OS/
├── app/
│   ├── index.html          # Main app
│   ├── styles.css          # Base styles
│   ├── styles-phase1.css   # Phase 1 features
│   ├── styles-phase2.css   # Lead detail modal
│   ├── styles-pipeline.css # Pipeline enhancements
│   ├── script-v2.js        # Main app logic
│   ├── script-phase2.js    # Lead detail & follow-ups
│   ├── database.js         # Database layer
│   └── models.js           # Data models
├── README.md               # This file
└── CHANGELOG.md            # Version history
```

---

## 🎮 How to Use

### Navigation
- **Sidebar**: Click icons or use keyboard shortcuts
- **Alt + 1**: Dashboard
- **Alt + 2**: Pipeline
- **Alt + 3**: All Leads
- **N**: New Lead (when not in input)

### Managing Leads

**Create Lead**:
1. Click "New Lead" button (top right)
2. Fill form
3. Click "Create Lead"

**View Lead Details**:
- Click any lead in table
- Click any card in pipeline
- See full 360° view

**Quick Actions** (Pipeline):
1. Hover over card
2. Click action button:
   - 📞 Call
   - 💬 WhatsApp
   - 📧 Email
   - 🔄 Change Status (NEW!)
   - 👁️ View Details

**Change Status** (2 ways):
1. **Drag & Drop**: Drag card to new column
2. **Quick Change**: Click 🔄 button → Select status

### Follow-ups

**Schedule Follow-up**:
1. Open lead details
2. Click "Schedule Follow-up"
3. Set date, time, type, notes
4. Click "Schedule"

**View Follow-ups**:
- Activity tab in lead details
- Shows all scheduled & completed

---

## 🎨 Design Features

### Glassmorphism
- Frosted glass effect cards
- Backdrop blur
- Semi-transparent backgrounds
- Modern, premium look

### Dark Theme
- Easy on eyes
- Professional appearance
- Color-coded statuses
- Vibrant accent colors

### Animations
- Smooth transitions
- Hover effects
- Loading states
- Toast notifications

---

## 📊 Database Schema

### Tables
- **leads** - Main lead data
- **activities** - All interactions & notes
- **follow_ups** - Scheduled follow-ups (Phase 2)

### Lead Statuses
1. New
2. Contacted
3. Qualified
4. Proposal Sent
5. Negotiation
6. Won
7. Lost
8. On Hold

### Lead Sources
- Website Form
- Manual Entry
- Referral
- Email Campaign
- Social Media
- Cold Call

---

## 🧪 Testing

### Quick Test Checklist

**Dashboard**:
- [ ] KPIs show numbers
- [ ] Pipeline chart shows bars
- [ ] Recent activity shows items
- [ ] Notifications clickable
- [ ] View All works

**Pipeline**:
- [ ] Cards show in columns
- [ ] Hover shows quick actions
- [ ] Call/WhatsApp/Email work
- [ ] Status change dropdown works
- [ ] Drag & drop works

**Lead Details**:
- [ ] Modal opens on click
- [ ] Tabs switch correctly
- [ ] Notes can be added
- [ ] Follow-ups can be scheduled
- [ ] Activity timeline shows

**Data Persistence**:
- [ ] Leads persist after refresh
- [ ] Notes persist
- [ ] Status changes persist

---

## 🎯 Coming Soon

### Phase 3: Automation
- Email templates
- Auto-follow-up rules
- SMS integration
- WhatsApp automation

### Phase 4: Team Collaboration
- Multi-user support
- Lead assignment
- Team activity feed
- Notifications

### Phase 5: Analytics
- Conversion funnel
- Revenue forecasting
- Performance metrics
- Custom reports

---

## 🐛 Known Issues

None currently! 🎉

---

## 📝 Notes

### Data Storage
- All data in browser localStorage
- Max ~10MB storage
- Clear localStorage to reset: `localStorage.clear()`

### Browser Support
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- IE: ❌ Not supported

### Mobile
- Responsive design
- Touch-friendly
- Quick actions always visible
- Optimized for small screens

---

## 🆘 Troubleshooting

**Leads not showing?**
- Refresh page → Auto-seeds 15 leads
- Check browser console for errors

**Cards empty in Pipeline?**
- Column statuses now match database
- Should show leads distributed across columns

**Quick actions not working?**
- Make sure you're hovering over card
- Check if phone/email exists for lead

**Data lost?**
- Don't clear localStorage
- Don't use incognito mode
- Export data regularly (coming soon)

---

## 🎉 Credits

Built with ❤️ for efficient lead management

**Developed by**: Subix Team  
**Version**: 2.0  
**Last Updated**: February 12, 2026

---

## 📞 Support

Having issues? Want to suggest features?

Just ask! 😊

---

**🚀 Start managing leads like a pro!**
