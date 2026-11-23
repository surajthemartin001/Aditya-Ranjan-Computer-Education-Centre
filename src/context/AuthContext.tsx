import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { normalizeEmailKey, sanitizeRollKey } from '../services/firestoreService';
import type { StaffProfile, StudentProfile, TeacherPermissions } from '../types/models';

export type ResolvedPortalRole =
  | 'managing_director'
  | 'head_teacher'
  | 'teacher'
  | 'staff'
  | 'student'
  | 'unauthorized'
  | 'guest';

const BOOTSTRAP_MD_EMAIL = 'surajthemartin001@gmail.com';

const DEFAULT_MD_PERMISSIONS: TeacherPermissions = {
  viewStudents: true,
  markAttendance: true,
  editAttendance: true,
  uploadMaterials: true,
  createAssignments: true,
  createTests: true,
  publishTests: true,
  viewResults: true,
  publishAnnouncements: true,
};

interface AuthContextValue {
  firebaseUser: User | null;
  loading: boolean;
  role: ResolvedPortalRole;
  staffProfile: StaffProfile | null;
  studentProfile: StudentProfile | null;
  statusMessage: string | null;
  signInStaffWithGoogle: () => Promise<ResolvedPortalRole>;
  signInStaffWithPassword: (email: string, password: string) => Promise<ResolvedPortalRole>;
  signInStudentWithRollAndPassword: (rollNumber: string, password: string) => Promise<void>;
  signInStudentWithGoogle: () => Promise<void>;
  activateStudentWithPassword: (params: {
    rollNumber: string;
    activationCode: string;
    password: string;
  }) => Promise<void>;
  activateStudentWithGoogle: (params: {
    rollNumber: string;
    activationCode: string;
  }) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<ResolvedPortalRole>('guest');
  const [staffProfile, setStaffProfile] = useState<StaffProfile | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const resolveAccount = useCallback(async (user: User | null): Promise<ResolvedPortalRole> => {
    if (!user) {
      setRole('guest');
      setStaffProfile(null);
      setStudentProfile(null);
      setStatusMessage(null);
      return 'guest';
    }

    setStatusMessage(null);

    try {
      // 1. Check Bootstrap Managing Director or Admins collection
      const isBootstrap =
        user.email?.toLowerCase() === BOOTSTRAP_MD_EMAIL && user.emailVerified === true;

      let adminDocExists = false;
      try {
        const adminSnap = await getDoc(doc(db, 'admins', user.uid));
        adminDocExists = adminSnap.exists();
      } catch {
        adminDocExists = false;
      }

      if (isBootstrap || adminDocExists) {
        let mdProfile: StaffProfile = {
          id: user.uid,
          uid: user.uid,
          email: user.email || BOOTSTRAP_MD_EMAIL,
          name: 'Ajay Kumar (Managing Director)',
          role: 'managing_director',
          designation: 'Managing Director',
          qualification: 'B.Sc (IT)',
          assignedCourseIds: [],
          assignedBatchIds: [],
          permissions: DEFAULT_MD_PERMISSIONS,
          isActive: true,
        };
        try {
          const staffSnap = await getDoc(doc(db, 'staffProfiles', user.uid));
          if (staffSnap.exists()) {
            mdProfile = { id: staffSnap.id, ...(staffSnap.data() as Omit<StaffProfile, 'id'>) };
          }
        } catch {
          // keep default MD profile
        }
        setStaffProfile(mdProfile);
        setStudentProfile(null);
        setRole('managing_director');
        return 'managing_director';
      }

      // 2. Check existing StaffProfile
      try {
        const staffSnap = await getDoc(doc(db, 'staffProfiles', user.uid));
        if (staffSnap.exists()) {
          const data = { id: staffSnap.id, ...(staffSnap.data() as Omit<StaffProfile, 'id'>) };
          if (!data.isActive) {
            setStatusMessage('This staff account is currently deactivated. Please contact Management.');
            setRole('unauthorized');
            setStaffProfile(null);
            return 'unauthorized';
          }
          setStaffProfile(data);
          setStudentProfile(null);
          setRole(data.role);
          return data.role;
        }
      } catch {
        // continue checking staffInvites
      }

      // 3. Check pending Staff Invite by email (first-time teacher/staff login)
      if (user.email) {
        const inviteKey = normalizeEmailKey(user.email);
        try {
          const inviteSnap = await getDoc(doc(db, 'staffInvites', inviteKey));
          if (inviteSnap.exists()) {
            const invite = inviteSnap.data() as StaffProfile & { isActive: boolean };
            if (invite.isActive) {
              const batch = writeBatch(db);
              const newStaff: Omit<StaffProfile, 'id'> = {
                uid: user.uid,
                email: user.email,
                phone: invite.phone || '',
                name: invite.name || user.displayName || 'Faculty Member',
                role: invite.role || 'teacher',
                designation: invite.designation || 'Faculty',
                qualification: invite.qualification || '',
                assignedCourseIds: invite.assignedCourseIds || [],
                assignedBatchIds: invite.assignedBatchIds || [],
                permissions: invite.permissions || {
                  viewStudents: true,
                  markAttendance: true,
                  editAttendance: false,
                  uploadMaterials: true,
                  createAssignments: true,
                  createTests: true,
                  publishTests: false,
                  viewResults: true,
                  publishAnnouncements: false,
                },
                isActive: true,
                inviteKey,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              };
              batch.set(doc(db, 'staffProfiles', user.uid), newStaff);
              batch.update(doc(db, 'staffInvites', inviteKey), {
                claimedUid: user.uid,
                updatedAt: serverTimestamp(),
              });
              await batch.commit();

              setStaffProfile({ id: user.uid, ...newStaff });
              setStudentProfile(null);
              setRole(newStaff.role);
              return newStaff.role;
            }
          }
        } catch {
          // continue checking student profile
        }
      }

      // 4. Check Approved Active Student via userDirectory & studentProfiles
      try {
        const dirSnap = await getDoc(doc(db, 'userDirectory', user.uid));
        if (dirSnap.exists()) {
          const dir = dirSnap.data() as {
            role: string;
            status: string;
            studentDocId?: string;
            rollNumber?: string;
          };
          if (dir.role === 'student') {
            if (dir.status === 'suspended') {
              setStatusMessage(
                'Your student portal access is currently suspended. Please contact the institute office.'
              );
              setRole('unauthorized');
              setStudentProfile(null);
              return 'unauthorized';
            }
            if (dir.studentDocId) {
              const stuSnap = await getDoc(doc(db, 'studentProfiles', dir.studentDocId));
              if (stuSnap.exists()) {
                const stu = { id: stuSnap.id, ...(stuSnap.data() as Omit<StudentProfile, 'id'>) };
                if (stu.status === 'suspended') {
                  setStatusMessage(
                    'Your student portal access is currently suspended. Please contact the institute office.'
                  );
                  setRole('unauthorized');
                  setStudentProfile(null);
                  return 'unauthorized';
                }
                setStudentProfile(stu);
                setStaffProfile(null);
                setRole('student');
                return 'student';
              }
            }
          }
        }

        // Fallback query by uid on studentProfiles
        const stuQ = await getDocs(
          query(collection(db, 'studentProfiles'), where('uid', '==', user.uid))
        );
        if (!stuQ.empty) {
          const first = stuQ.docs[0];
          const stu = { id: first.id, ...(first.data() as Omit<StudentProfile, 'id'>) };
          if (stu.status === 'suspended') {
            setStatusMessage('Your student account is suspended. Contact Management.');
            setRole('unauthorized');
            return 'unauthorized';
          }
          setStudentProfile(stu);
          setStaffProfile(null);
          setRole('student');
          return 'student';
        }
      } catch {
        // not a student
      }

      setRole('unauthorized');
      setStaffProfile(null);
      setStudentProfile(null);
      setStatusMessage(
        'No approved institute student or staff account is linked to this sign-in. Admissions must be approved by Management before portal access is granted.'
      );
      return 'unauthorized';
    } catch {
      setRole('unauthorized');
      return 'unauthorized';
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      await resolveAccount(user);
      setLoading(false);
    });
    return () => unsub();
  }, [resolveAccount]);

  const signInStaffWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    return resolveAccount(cred.user);
  };

  const signInStaffWithPassword = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    return resolveAccount(cred.user);
  };

  const signInStudentWithRollAndPassword = async (rollNumber: string, password: string) => {
    const rollKey = sanitizeRollKey(rollNumber);
    if (!rollKey) throw new Error('Please enter a valid institute-issued Roll Number.');
    const lookupSnap = await getDoc(doc(db, 'studentLoginLookup', rollKey));
    if (!lookupSnap.exists()) {
      throw new Error(
        'No approved student account found for this Roll Number. Pending or unapproved applicants cannot log in.'
      );
    }
    const lookup = lookupSnap.data() as { loginEmail: string; status: string };
    if (lookup.status === 'suspended') {
      throw new Error('This student account has been suspended by Management.');
    }
    if (lookup.status === 'pending_activation') {
      throw new Error(
        'This Roll Number is approved but not yet activated. Please use "Activate Approved Student Account" first to set your password.'
      );
    }
    const cred = await signInWithEmailAndPassword(auth, lookup.loginEmail, password);
    const resolved = await resolveAccount(cred.user);
    if (resolved !== 'student') {
      await signOut(auth);
      throw new Error('Unable to verify active student account status.');
    }
  };

  const signInStudentWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    const resolved = await resolveAccount(cred.user);
    if (resolved !== 'student') {
      await signOut(auth);
      throw new Error(
        'This Google account is not linked to an approved student Roll Number. If Management approved your admission, activate your account first.'
      );
    }
  };

  const bindActivatedStudentAccount = async (
    user: User,
    rollKey: string,
    activationKey: string,
    activationData: { studentDocId: string; activationCode: string; loginEmail: string }
  ) => {
    const batch = writeBatch(db);
    const finalEmail = user.email || activationData.loginEmail;

    batch.set(doc(db, 'userDirectory', user.uid), {
      uid: user.uid,
      role: 'student',
      studentDocId: activationData.studentDocId,
      rollNumber: rollKey,
      activationKey,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    batch.update(doc(db, 'studentActivations', activationKey), {
      status: 'activated',
      uid: user.uid,
      loginEmail: finalEmail,
      updatedAt: serverTimestamp(),
    });

    batch.update(doc(db, 'studentLoginLookup', rollKey), {
      status: 'active',
      loginEmail: finalEmail,
      updatedAt: serverTimestamp(),
    });

    batch.update(doc(db, 'studentProfiles', activationData.studentDocId), {
      uid: user.uid,
      status: 'active',
      updatedAt: serverTimestamp(),
    });

    await batch.commit();
    await resolveAccount(user);
  };

  const activateStudentWithPassword = async (params: {
    rollNumber: string;
    activationCode: string;
    password: string;
  }) => {
    const rollKey = sanitizeRollKey(params.rollNumber);
    const code = params.activationCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (!rollKey || !code) {
      throw new Error('Enter both your institute-issued Roll Number and Activation Code.');
    }
    if (params.password.length < 8) {
      throw new Error('Choose a strong password of at least 8 characters.');
    }

    const activationKey = `${rollKey}_${code}`;
    const snap = await getDoc(doc(db, 'studentActivations', activationKey));
    if (!snap.exists()) {
      throw new Error(
        'Invalid Roll Number or Activation Code. Please verify the credentials issued by Management upon admission approval.'
      );
    }
    const data = snap.data() as {
      rollNumber: string;
      studentDocId: string;
      activationCode: string;
      loginEmail: string;
      status: string;
    };
    if (data.status !== 'pending_activation') {
      throw new Error('This student account is already activated or no longer eligible. Use Student Login instead.');
    }

    const cred = await createUserWithEmailAndPassword(auth, data.loginEmail, params.password);
    await bindActivatedStudentAccount(cred.user, rollKey, activationKey, data);
  };

  const activateStudentWithGoogle = async (params: {
    rollNumber: string;
    activationCode: string;
  }) => {
    const rollKey = sanitizeRollKey(params.rollNumber);
    const code = params.activationCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (!rollKey || !code) {
      throw new Error('Enter both your institute-issued Roll Number and Activation Code.');
    }
    const activationKey = `${rollKey}_${code}`;
    const snap = await getDoc(doc(db, 'studentActivations', activationKey));
    if (!snap.exists()) {
      throw new Error(
        'Invalid Roll Number or Activation Code. Only institute-approved students can activate an account.'
      );
    }
    const data = snap.data() as {
      rollNumber: string;
      studentDocId: string;
      activationCode: string;
      loginEmail: string;
      status: string;
    };
    if (data.status !== 'pending_activation') {
      throw new Error('This student account is already activated. Please use Student Login.');
    }

    const cred = await signInWithPopup(auth, googleProvider);
    await bindActivatedStudentAccount(cred.user, rollKey, activationKey, data);
  };

  const requestPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const refreshProfile = async () => {
    await resolveAccount(auth.currentUser);
  };

  const logout = async () => {
    await signOut(auth);
    setRole('guest');
    setStaffProfile(null);
    setStudentProfile(null);
    setStatusMessage(null);
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        loading,
        role,
        staffProfile,
        studentProfile,
        statusMessage,
        signInStaffWithGoogle,
        signInStaffWithPassword,
        signInStudentWithRollAndPassword,
        signInStudentWithGoogle,
        activateStudentWithPassword,
        activateStudentWithGoogle,
        requestPasswordReset,
        refreshProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
