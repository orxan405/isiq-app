const User = require('../models/User');
const Match = require('../models/Match');

// @GET /api/v1/users/discover
const discoverUsers = async (req, res) => {
  try {
    const { minAge, maxAge, city, interests, gender } = req.query;
    const currentUser = await User.findById(req.user._id);

    // Match olan istifadəçiləri tap
    const matches = await Match.find({
      users: req.user._id,
      isActive: true,
    });
    const matchedUserIds = matches.flatMap((m) =>
      m.users.filter((u) => u.toString() !== req.user._id.toString())
    );

    // 24 saatdan köhnə dislike-ları çıxar
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeDislikedIds = currentUser.dislikedUsers
      .filter((d) => d.dislikedAt > twentyFourHoursAgo)
      .map((d) => d.user);

    const filter = {
      _id: {
        $ne: req.user._id,
        $nin: [
          ...matchedUserIds,
          ...activeDislikedIds,
          ...currentUser.blockedUsers,
        ],
      },
      isActive: true,
    };

    // Cins filtri — manual seçim varsa onu istifadə et, yoxsa default
    if (gender) {
      filter.gender = gender;
    } else if (currentUser.interestedIn && currentUser.interestedIn.length > 0) {
      filter.gender = { $in: currentUser.interestedIn };
    }

    // Yaş filtri
    if (minAge || maxAge) {
      filter.age = {};
      if (minAge) filter.age.$gte = parseInt(minAge);
      if (maxAge) filter.age.$lte = parseInt(maxAge);
    }

    // Şəhər filtri
    if (city) filter.city = { $regex: city, $options: 'i' };

    // Maraqlar filtri
    if (interests) {
      const interestList = interests.split(',').filter(Boolean);
      if (interestList.length > 0) {
        filter.interests = { $in: interestList };
      }
    }

    const users = await User.find(filter)
      .select('name age gender city bio photos interests height weight birthDate job education pushToken lastSeen')
      .limit(20);

    res.json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/v1/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      'name age gender city bio photos interests height weight birthDate job education lastSeen'
    );
    if (!user) {
      return res.status(404).json({ success: false, message: 'İstifadəçi tapılmadı' });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @PUT /api/v1/users/profile/update
const updateProfile = async (req, res) => {
  try {
    const allowedFields = ['name', 'email', 'bio', 'city', 'job', 'education', 'height', 'weight', 'birthDate', 'interests', 'interestedIn'];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (updates.email) {
      const existingUser = await User.findOne({ email: updates.email, _id: { $ne: req.user._id } });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Bu email artıq istifadə edilir' });
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, message: 'Profil yeniləndi', user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @PUT /api/v1/users/push-token
const updatePushToken = async (req, res) => {
  try {
    const { pushToken } = req.body;
    await User.findByIdAndUpdate(req.user._id, { pushToken });
    res.json({ success: true, message: 'Push token saxlandı' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @PUT /api/v1/users/settings
const updateSettings = async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { isActive, lastSeen: new Date() },
      { new: true }
    );
    res.json({ success: true, message: 'Tənzimləmələr yeniləndi', user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @DELETE /api/v1/users/account
const deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { isActive: false });
    res.json({ success: true, message: 'Hesab silindi' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/v1/users/:id/block
const blockUser = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);

    if (currentUser.blockedUsers.includes(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Artıq bloklanıb' });
    }

    currentUser.blockedUsers.push(req.params.id);
    await currentUser.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'İstifadəçi bloklandı' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  discoverUsers,
  getUserById,
  updateProfile,
  updateSettings,
  deleteAccount,
  blockUser,
  updatePushToken,
};