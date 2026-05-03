import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput, Platform, Image } from "react-native";
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialIcons, Feather, FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';

import { useThemeColor } from "@/packages/ui/hooks";
import {
  Typo,
  Button,
  SegmentedControl,
  Accordion,
} from "@/packages/ui/components/ui";
import api from "@/apps/mobile/src/services/api";

const UserInfoView = ({ isEligible, router, setTabIndex }: any) => {
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      try {
        // Retrieve fresh database entries
        const res = await api.get("/eligibility/me");
        const json = res.data;

        if (isMounted) {
          // api interceptor already unwraps response.data.data if success is true
          if (json) {
            setProfileData(json);
          } else {
            setErrorMsg("Failed to fetch user profile");
          }
        }

      } catch (err: any) {
        if (isMounted) {
          const msg = err.response?.data?.message || err.message || "API offline.";
          setErrorMsg(msg);
        }
      } finally {

        if (isMounted) setLoading(false);
      }
    };
    fetchProfile();
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return <View style={{ padding: 40, alignItems: 'center' }}><Typo variant="body">Gathering live database profile...</Typo></View>;
  }

  if (errorMsg || !profileData || !profileData.user) {
    return <View style={{ padding: 40, alignItems: 'center' }}><Typo variant="body" style={{ color: "#EF4444" }}>{errorMsg || "Database Error"}</Typo></View>;
  }

  //get user and donation history
  const { user, donationHistory } = profileData;
  const latestDonation = donationHistory.length > 0 ? donationHistory[0] : null;

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  let eligibleFromDate: Date | null = null;
  let isRecentDonationDeferral = false;

  //Next donation date (4 month wait)
  if (latestDonation) {
    const d = new Date(latestDonation.donationDate);
    d.setMonth(d.getMonth() + 4);
    eligibleFromDate = d;

    if (new Date() < eligibleFromDate) {
      isRecentDonationDeferral = true; //Donation defferral for recent donation
    }
  }

  let finalIsEligible = isEligible;
  let finalStatusColor = "#6B7280";
  let finalIconName = "help-circle" as any;
  let finalStatusText = "Unknown (Take Quiz)";

  //Status 
  if (isRecentDonationDeferral) {
    finalIsEligible = false;
    finalStatusColor = "#EF4444";
    finalIconName = "user-x";
    finalStatusText = "Not eigible due to recent donation is less than 4 months";
  } else if (isEligible === true) {
    finalStatusColor = "#10B981";
    finalIconName = "user-check";
    finalStatusText = "Eligible for donation";
  } else if (isEligible === false) {
    finalStatusColor = "#EF4444";
    finalIconName = "user-x";
    finalStatusText = "Not Eligible (Check Quiz Results)";
  }

  // --- UI 1 ---
  //render user profile, status, donation history cards
  const displayEligibleFrom = (finalIsEligible === false)
    ? " - " //Does not show next donation date if not eligible
    : (eligibleFromDate ? formatDate(eligibleFromDate.toISOString()) : " - ");

  return (
    <ScrollView contentContainerStyle={styles.viewContent} showsVerticalScrollIndicator={false}>
      {/* 1. Donor Profile Card */}
      <View style={[styles.card, { backgroundColor: "#FFFFFF" }]}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center", marginRight: 16 }}>
            <Feather name="user" size={24} color="#6B7280" />
          </View>
          <View>
            <Typo variant="body" style={{ marginBottom: 0 }}>{user.name}</Typo>
            <Typo variant="body" style={styles.grayText}>{user.age} years old • {user.sex || "N/A"}</Typo>

          </View>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", backgroundColor: "#F9FAFB", padding: 12, borderRadius: 12 }}>
          <View style={{ alignItems: "center", flex: 1 }}>
            <Feather name="droplet" size={20} color="#EF4444" style={{ marginBottom: 4 }} />
            <Typo variant="caption" style={styles.grayTextSmall}>BLOOD TYPE</Typo>
            <Typo variant="body" style={styles.boldText}>{user.bloodType}</Typo>
          </View>
          <View style={{ width: 1, backgroundColor: "#E5E7EB" }} />
          <View style={{ alignItems: "center", flex: 1 }}>
            <Feather name="activity" size={20} color="#3B82F6" style={{ marginBottom: 4 }} />
            <Typo variant="caption" style={styles.grayTextSmall}>WEIGHT</Typo>
            <Typo variant="body" style={styles.boldText}>{user.weight || "--"} kg</Typo>

          </View>
        </View>
      </View>

      {/* 2. Interactive Status Banner */}
      <View style={[styles.card, {
        backgroundColor: finalIsEligible === true ? "#ECFDF5" : (finalIsEligible === false ? "#FEF2F2" : "#FFFBEB"),
        borderColor: finalIsEligible === true ? "#10B981" : (finalIsEligible === false ? "#EF4444" : "#F59E0B"),
        borderWidth: 1
      }]}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
          <Feather name={finalIconName} size={28} color={finalStatusColor} style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Typo variant="body" style={[styles.boldText, { fontSize: 18, color: finalStatusColor }]}>
              {finalIsEligible === null ? "Eligibility Unknown" : (finalIsEligible ? "Eligible to Donate" : "Not Eligible")}
            </Typo>
            <Typo variant="body" style={{ color: finalIsEligible === null ? "#D97706" : "#4B5563", marginTop: 4 }}>
              {finalStatusText}
            </Typo>

            {/* CTA for Unknown State */}
            {finalIsEligible === null && (
              <Button
                label="Take Eligibility Quiz"
                variant="primary"
                style={{ marginTop: 16, backgroundColor: finalStatusColor }}
                onPress={() => setTabIndex(1)}
              />
            )}
          </View>
        </View>
      </View>

      {/* 3. Next Eligibility Dates */}
      <View style={styles.rowCards}>
        <View style={[styles.card, { backgroundColor: "#FFFFFF", flex: 1, marginRight: 8, alignItems: "flex-start", padding: 16 }]}>
          <Feather name="calendar" size={18} color="#6B7280" style={{ marginBottom: 8 }} />
          <Typo variant="caption" style={styles.grayTextSmall}>LAST DONATION</Typo>
          <Typo variant="body" style={[styles.boldText, { marginTop: 4 }]}>
            {latestDonation ? formatDate(latestDonation.donationDate) : "None"}
          </Typo>
        </View>
        <View style={[styles.card, { backgroundColor: "#FFFFFF", flex: 1, marginLeft: 8, alignItems: "flex-start", padding: 16 }]}>
          <Feather name="clock" size={18} color="#EF4444" style={{ marginBottom: 8 }} />
          <Typo variant="caption" style={styles.grayTextSmall}>NEXT ELIGIBLE</Typo>
          <Typo variant="body" style={[styles.boldText, { marginTop: 4, color: "#EF4444" }]}>
            {displayEligibleFrom}
          </Typo>
        </View>
      </View>

      {/* 4. Action Card for Medical Records */}
      <TouchableOpacity
        style={[styles.card, { backgroundColor: "#FFFFFF", flexDirection: "row", alignItems: "center", paddingVertical: 24 }]}
        onPress={() => router.push("/(user)/medical-records")}
        activeOpacity={0.7}
      >
        <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center", marginRight: 16 }}>
          <Feather name="folder" size={24} color="#3B82F6" />
        </View>
        <View style={{ flex: 1 }}>
          <Typo variant="body" style={[styles.boldText, { fontSize: 16 }]}>Medical Records</Typo>
          <Typo variant="caption" style={{ color: "#6B7280" }}>Store and manage your health documents</Typo>
        </View>
        <Feather name="chevron-right" size={24} color="#9CA3AF" />
      </TouchableOpacity>

      {/* 5. Donation History Timeline */}
      <View style={[styles.card, { backgroundColor: "#FFFFFF" }]}>
        <Typo variant="body" style={[styles.boldText, { fontSize: 18, marginBottom: 16 }]}>Donation History</Typo>

        {donationHistory.length === 0 && (
          <View style={{ alignItems: "center", paddingVertical: 24 }}>
            <Feather name="inbox" size={32} color="#D1D5DB" style={{ marginBottom: 12 }} />
            <Typo variant="body" style={styles.grayText}>No past donation records.</Typo>
          </View>
        )}

        <View style={{ paddingLeft: 8 }}>
          {donationHistory.map((record: any, index: number) => (
            <View key={record._id || index} style={{ flexDirection: "row", marginBottom: index === donationHistory.length - 1 ? 0 : 24 }}>
              {/* Timeline dot and line */}
              <View style={{ alignItems: "center", marginRight: 16 }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: "#EF4444", zIndex: 1 }} />
                {index < donationHistory.length - 1 && (
                  <View style={{ width: 2, flex: 1, backgroundColor: "#FEE2E2", marginTop: -6, marginBottom: -28 }} />
                )}
              </View>
              {/* Timeline content */}
              <View style={{ flex: 1, marginTop: -4 }}>
                <Typo variant="body" style={styles.boldText}>{formatDate(record.donationDate)}</Typo>
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                  <Feather name="map-pin" size={12} color="#6B7280" style={{ marginRight: 4 }} />
                  <Typo variant="caption" style={{ color: "#6B7280" }}>{record.location}</Typo>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

// --- UI 2 ---

//reveives data and callbacks
const CheckEligibilityView = ({
  colors,
  onShowModal,
  quizTaken,
  showQuiz,
  showResult,
  setQuizTaken,
  setShowQuiz,
  setShowResult,
  isEligible,
  ineligibilityReasons,
  onCompleteQuiz,
  tipLabel,
  onTipPress
}: any) => {
  //store yes/no answers
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [accepted, setAccepted] = useState(false);
  const [hemoglobin, setHemoglobin] = useState<string>("");
  const [bpSysInput, setBpSysInput] = useState<string>("");
  const [bpDiaInput, setBpDiaInput] = useState<string>("");
  const [malariaReturnDate, setMalariaReturnDate] = useState<string>("");
  const [foreignTravelReturnDate, setForeignTravelReturnDate] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);
  const [reportUris, setReportUris] = useState<string[]>([]);

  const pickReports = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      const uris = result.assets.map(a => a.uri);
      setReportUris(prev => [...prev, ...uris].slice(0, 5));
    }
  };

  const removeReport = (index: number) => {
    setReportUris(prev => prev.filter((_, i) => i !== index));
  };

  const [showMalariaPicker, setShowMalariaPicker] = useState(false);
  const [showForeignPicker, setShowForeignPicker] = useState(false);

  const parseDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    const parts = dateStr.split(/[\/-]/);
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return new Date();
  };

  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        const response = await api.get("/eligibility/history");
        const json = response.data;
        if (isMounted && json) {
          // api interceptor already unwraps response.data.data
          setHistory(json);
        }

      } catch (err) {
        console.log("Failed to fetch history:", err);
      } finally {
        if (isMounted) setLoadingHistory(false);
      }
    };
    fetchHistory();
    return () => { isMounted = false; }; //clean up
  }, [quizTaken]);

  const questions = [
    { id: 1, text: "1. Chronic diseases:" },
    { id: 2, text: "2. Recent surgery:" },
    { id: 3, text: "3. Recent travel abroad (past 3 month):" },
    { id: 4, text: "4. Fever or infection:" },
    { id: 5, text: "5. Recent tattoo:" },
    { id: 6, text: "6. Pregnancy (if applicable):" },
    { id: 7, text: "7. Is your current weight above 50 kg?:" },
  ];

  const handleSelect = (qId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  };

  const isValidDdMmYyyy = (value: string) => {
    // Accepts: DD/MM/YYYY or DD-MM-YYYY
    const trimmed = value.trim();
    const match = /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/.exec(trimmed);
    if (!match) return false;

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);

    if (year < 1900 || year > 2100) return false;
    if (month < 1 || month > 12) return false;

    const daysInMonth = new Date(year, month, 0).getDate(); // month is 1-based
    return day >= 1 && day <= daysInMonth;
  };

  //Validation - answer all required questions
  const handleSubmit = async () => {
    if (Object.keys(answers).length < 7) {
      return setFormError("Please answer all questions before submitting.");
    }

    setFormError("Connecting to backend...");

    const hbRaw = hemoglobin.trim();
    const sysRaw = bpSysInput.trim();
    const diaRaw = bpDiaInput.trim();
    const malariaDateRaw = malariaReturnDate.trim();
    const foreignReturnDateRaw = foreignTravelReturnDate.trim();

    // Initial syntax validation

    //Hemoglobin between 5 - 10
    if (hbRaw !== "") {
      const hb = Number(hbRaw);
      if (!Number.isFinite(hb) || hb < 5 || hb > 20) return setFormError("Hemoglobin level must be between 5 and 20 g/dL.");
    }

    //Blood pressure parsing
    let bpSys: number | undefined;
    let bpDia: number | undefined;
    if (sysRaw !== "" && diaRaw !== "") {
      bpSys = Number(sysRaw);
      bpDia = Number(diaRaw);
      if (isNaN(bpSys) || isNaN(bpDia)) {
        return setFormError("Blood pressure must be valid numbers");
      }
      
      // Validate systolic range (50-250)
      if (bpSys < 50 || bpSys > 250) {
        return setFormError("Systolic blood pressure must be between 50 and 250 mmHg");
      }
      
      // Validate diastolic range (30-150)
      if (bpDia < 30 || bpDia > 150) {
        return setFormError("Diastolic blood pressure must be between 30 and 150 mmHg");
      }
    } else if (sysRaw !== "" || diaRaw !== "") {
       return setFormError("Both Systolic and Diastolic pressure must be filled together");
    }

    //Date format check
    if (malariaDateRaw !== "" && !isValidDdMmYyyy(malariaDateRaw)) {
      return setFormError("Malaria-endemic country return date must be in DD/MM/YYYY format.");
    }
    if (foreignReturnDateRaw !== "" && !isValidDdMmYyyy(foreignReturnDateRaw)) {
      return setFormError("Foreign travel return date must be in DD/MM/YYYY format.");
    }

    const formatForBackend = (val: string) => {
      if (!val) return undefined;
      const [d, m, y] = val.split(/[\/-]/);
      return `${y}-${m}-${d}`;
    };

    const payload = {

      //convert UI answers to backend field names.
      chronicDisease: answers[1] === 'yes',
      recentSurgery: answers[2] === 'yes',
      recentTravel: answers[3] === 'yes',
      feverOrInfection: answers[4] === 'yes',
      recentTattoo: answers[5] === 'yes',
      pregnancy: answers[6] === 'yes',
      weightAbove50: answers[7] === 'yes',
      hemoglobinLevel: hbRaw !== "" ? Number(hbRaw) : undefined, //become number if typed
      bloodPressureSystolic: bpSys,
      bloodPressureDiastolic: bpDia,
      malariaEndemicReturnDate: formatForBackend(malariaDateRaw),
      foreignTravelReturnDate: formatForBackend(foreignReturnDateRaw)
    };

    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined) formData.append(key, String(value));
    });

    reportUris.forEach((uri, idx) => {
      const filename = uri.split("/").pop();
      const match = /\.(\w+)$/.exec(filename || "");
      const type = match ? `image/${match[1]}` : "image";
      formData.append("reports", {
        uri,
        name: filename,
        type,
      } as any);
    });

    try {
      const response = await api.post("/eligibility/check", formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const resData = response.data;
      if (!resData || typeof resData.isEligible === 'undefined') {
        return setFormError("Failed to validate eligibility");
      }

      setFormError(null);
      const { isEligible, reasons } = resData;


      onCompleteQuiz(isEligible, reasons);

      setQuizTaken(true);
      setShowQuiz(false);
      setShowResult(true);
      onShowModal();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Server unreachable.";
      setFormError(msg);
    }

  };

  const handleTakeQuiz = () => {
    setShowQuiz(true);
    setShowResult(false);
    // Reset form when taking quiz again
    if (quizTaken) {
      setAnswers({});
      setAccepted(false);
      setHemoglobin("");
      setBpSysInput("");
      setBpDiaInput("");
      setMalariaReturnDate("");
      setForeignTravelReturnDate("");
      setShowMalariaPicker(false);
      setShowForeignPicker(false);
      setFormError(null);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.viewContent} showsVerticalScrollIndicator={false}>
      {!showQuiz && !showResult ? (
        <View style={[styles.card, { backgroundColor: "#FFFFFF", alignItems: "center", paddingVertical: 40 }]}>
          <View style={{ backgroundColor: "#EFF6FF", width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
            <Feather name="clipboard" size={32} color="#3B82F6" />
          </View>
          <Typo variant="h2" style={{ textAlign: "center", fontSize: 22, fontWeight: "700", marginBottom: 12 }}>Health Questionnaire</Typo>
          <Typo variant="body" style={{ textAlign: "center", lineHeight: 22, color: "#6B7280", marginBottom: 32, paddingHorizontal: 16 }}>
            Take a quick health assessment to check your eligibility for blood donation. This helps ensure the safety of both donors and recipients.
          </Typo>
          <Button
            label={quizTaken ? "Retake Quiz" : "Take the Quiz"}
            variant="primary"
            onPress={handleTakeQuiz}
            style={{ paddingHorizontal: 32, minWidth: 200 }}
          />
        </View>

        //Quiz result
      ) : showResult ? (
        <View style={[styles.card, { backgroundColor: isEligible ? "#ECFDF5" : "#FEF2F2", borderColor: isEligible ? "#10B981" : "#EF4444", borderWidth: 1 }]}>
          <View style={{ alignItems: "center", marginBottom: 24 }}>
            <View style={{ backgroundColor: isEligible ? "#10B981" : "#EF4444", width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <Feather name={isEligible ? "check" : "x"} size={32} color="#FFFFFF" />
            </View>
            <Typo variant="h2" style={{ color: isEligible ? "#065F46" : "#991B1B", marginBottom: 8 }}>
              {isEligible ? "You Are Eligible!" : "Not Eligible"}
            </Typo>
            {isEligible ? (
              <Typo variant="body" style={{ textAlign: "center", color: "#065F46" }}>
                Based on your answers, you are cleared to donate blood.
              </Typo>
            ) : (
              <Typo variant="body" style={{ textAlign: "center", color: "#991B1B" }}>
                You cannot donate blood at this time.
              </Typo>
            )}
          </View>

          <View style={styles.resultContent}>
            {!isEligible && ineligibilityReasons && ineligibilityReasons.length > 0 && (
              <View style={{ backgroundColor: "#FFFFFF", padding: 16, borderRadius: 12, marginBottom: 24, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
                <Typo variant="body" style={{ fontWeight: "700", color: "#991B1B", marginBottom: 8 }}>Reason(s):</Typo>
                {ineligibilityReasons.map((r: string, idx: number) => (
                  <Typo key={idx} variant="body" style={{ color: "#7F1D1D", marginBottom: 4 }}>• {r}</Typo>
                ))}
              </View>
            )}

            
            <View style={{ gap: 12 }}>
              {isEligible ? (
                <Button
                  label="Schedule an Appointment"
                  variant="secondary"
                  onPress={() => {}} // TODO: Navigate to appointment scheduling (camp management)
                  style={{ backgroundColor: "#FFFFFF" }}
                />
              ) : (
                <Button
                  label={tipLabel}
                  variant="secondary"
                  onPress={onTipPress}
                  style={{ backgroundColor: "#FFFFFF" }}
                />
              )}
              <Button
                label="Retake Quiz"
                variant="primary"
                onPress={handleTakeQuiz}
                style={{ backgroundColor: isEligible ? "#10B981" : "#EF4444" }}
              />
            </View>
          </View>
        </View>
      ) : (
        <View style={{ gap: 16 }}>
          {/* Card 1: General Health */}
          <View style={[styles.card, { backgroundColor: "#FFFFFF" }]}>
            <Typo variant="body" style={{ marginBottom: 16 }}>General Health</Typo>
            {questions.map((q, idx) => (
              <View key={q.id} style={{ marginBottom: idx === questions.length - 1 ? 0 : 20 }}>
                <Typo variant="body" style={{ marginBottom: 12, fontWeight: "500" }}>{q.text}</Typo>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <TouchableOpacity 
                    style={{ flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: answers[q.id] === 'yes' ? "#EF4444" : "#E5E7EB", backgroundColor: answers[q.id] === 'yes' ? "#FEF2F2" : "#FFFFFF", alignItems: "center" }}
                    onPress={() => handleSelect(q.id, 'yes')}
                  >
                    <Typo variant="body" style={{ color: answers[q.id] === 'yes' ? "#EF4444" : "#4B5563", fontWeight: answers[q.id] === 'yes' ? "700" : "400" }}>Yes</Typo>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={{ flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: answers[q.id] === 'no' ? "#3B82F6" : "#E5E7EB", backgroundColor: answers[q.id] === 'no' ? "#EFF6FF" : "#FFFFFF", alignItems: "center" }}
                    onPress={() => handleSelect(q.id, 'no')}
                  >
                    <Typo variant="body" style={{ color: answers[q.id] === 'no' ? "#3B82F6" : "#4B5563", fontWeight: answers[q.id] === 'no' ? "700" : "400" }}>No</Typo>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* Card 2: Vital Signs */}
          <View style={[styles.card, { backgroundColor: "#FFFFFF" }]}>
            <Typo variant="body" style={{ marginBottom: 16 }}>Vital Signs (Optional)</Typo>
            
            <View style={{ marginBottom: 24 }}>
              <Typo variant="body" style={{ fontWeight: "500", marginBottom: 8 }}>Hemoglobin (g/dL)</Typo>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: "#F9FAFB", borderRadius: 16, height: 60, paddingHorizontal: 6 }}>
                <TouchableOpacity
                  onPress={() => {
                    let val = Number(hemoglobin);
                    if (isNaN(val) || val === 0 || !hemoglobin) val = 12.5;
                    else val = Math.max(5, val - 0.5);
                    setHemoglobin(val.toFixed(1).replace(/\.0$/, ''));
                  }}
                  style={{ width: 48, height: 48, backgroundColor: "#FFFFFF", borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}
                >
                  <MaterialIcons name="remove" size={24} color="#374151" />
                </TouchableOpacity>
                
                <TextInput
                  value={hemoglobin}
                  onChangeText={setHemoglobin}
                  onBlur={() => {
                    let val = Number(hemoglobin);
                    if (!isNaN(val) && hemoglobin !== "") {
                      val = Math.max(5, Math.min(20, val));
                      setHemoglobin(val.toFixed(1).replace(/\.0$/, ''));
                    }
                  }}
                  placeholder="e.g. 12.5"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: "600", color: "#111827" }}
                />

                <TouchableOpacity
                  onPress={() => {
                    let val = Number(hemoglobin);
                    if (isNaN(val) || val === 0 || !hemoglobin) val = 12.5;
                    else val = Math.min(20, val + 0.5);
                    setHemoglobin(val.toFixed(1).replace(/\.0$/, ''));
                  }}
                  style={{ width: 48, height: 48, backgroundColor: "#FFFFFF", borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}
                >
                  <MaterialIcons name="add" size={24} color="#374151" />
                </TouchableOpacity>
              </View>
            </View>

            <View>
              <Typo variant="body" style={{ fontWeight: "500", marginBottom: 8 }}>Blood Pressure (mmHg)</Typo>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    value={bpSysInput}
                    onChangeText={setBpSysInput}
                    placeholder="Systolic"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    style={{ backgroundColor: "#F9FAFB", borderRadius: 12, paddingHorizontal: 16, height: 52, fontSize: 16, color: "#111827", borderWidth: 1, borderColor: "#E5E7EB" }}
                  />
                  <Typo variant="caption" style={{ color: "#9CA3AF", marginTop: 4, textAlign: "center" }}>50-250</Typo>
                </View>
                <Typo variant="h2" style={{ color: "#D1D5DB", marginTop: -20 }}>/</Typo>
                <View style={{ flex: 1 }}>
                  <TextInput
                    value={bpDiaInput}
                    onChangeText={setBpDiaInput}
                    placeholder="Diastolic"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    style={{ backgroundColor: "#F9FAFB", borderRadius: 12, paddingHorizontal: 16, height: 52, fontSize: 16, color: "#111827", borderWidth: 1, borderColor: "#E5E7EB" }}
                  />
                  <Typo variant="caption" style={{ color: "#9CA3AF", marginTop: 4, textAlign: "center" }}>30-150</Typo>
                </View>
              </View>
            </View>
          </View>

          {/* Card 3: Travel */}
          <View style={[styles.card, { backgroundColor: "#FFFFFF" }]}>
            <Typo variant="body" style={{ marginBottom: 16 }}>Recent Travel (Optional)</Typo>
            
            <View style={{ marginBottom: 16 }}>
              <Typo variant="body" style={{ fontWeight: "500", marginBottom: 8 }}>Malaria-Endemic Return</Typo>
              <TouchableOpacity
                onPress={() => setShowMalariaPicker(true)}
                style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#F9FAFB", borderRadius: 12, paddingHorizontal: 16, height: 52, borderWidth: 1, borderColor: "#E5E7EB" }}
              >
                <Feather name="calendar" size={20} color="#9CA3AF" style={{ marginRight: 12 }} />
                <Typo variant="body" style={{ color: malariaReturnDate ? "#111827" : "#9CA3AF", flex: 1 }}>
                  {malariaReturnDate || "Select Return Date"}
                </Typo>
              </TouchableOpacity>
              {showMalariaPicker && (
                <View>
                  <DateTimePicker
                    value={malariaReturnDate ? parseDate(malariaReturnDate) : new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      if (Platform.OS === 'android') setShowMalariaPicker(false);
                      if (event.type !== 'dismissed' && selectedDate) {
                        const d = selectedDate.getDate().toString().padStart(2, '0');
                        const m = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
                        const y = selectedDate.getFullYear();
                        setMalariaReturnDate(`${d}/${m}/${y}`);
                      }
                    }}
                  />
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity onPress={() => setShowMalariaPicker(false)} style={{ alignItems: 'flex-end', padding: 8 }}>
                      <Typo variant="body" style={{ color: colors.tint, fontWeight: 'bold' }}>Done</Typo>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            <View>
              <Typo variant="body" style={{ fontWeight: "500", marginBottom: 8 }}>General Foreign Return</Typo>
              <TouchableOpacity
                onPress={() => setShowForeignPicker(true)}
                style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#F9FAFB", borderRadius: 12, paddingHorizontal: 16, height: 52, borderWidth: 1, borderColor: "#E5E7EB" }}
              >
                <Feather name="calendar" size={20} color="#9CA3AF" style={{ marginRight: 12 }} />
                <Typo variant="body" style={{ color: foreignTravelReturnDate ? "#111827" : "#9CA3AF", flex: 1 }}>
                  {foreignTravelReturnDate || "Select Return Date"}
                </Typo>
              </TouchableOpacity>
              {showForeignPicker && (
                <View>
                  <DateTimePicker
                    value={foreignTravelReturnDate ? parseDate(foreignTravelReturnDate) : new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      if (Platform.OS === 'android') setShowForeignPicker(false);
                      if (event.type !== 'dismissed' && selectedDate) {
                        const d = selectedDate.getDate().toString().padStart(2, '0');
                        const m = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
                        const y = selectedDate.getFullYear();
                        setForeignTravelReturnDate(`${d}/${m}/${y}`);
                      }
                    }}
                  />
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity onPress={() => setShowForeignPicker(false)} style={{ alignItems: 'flex-end', padding: 8 }}>
                      <Typo variant="body" style={{ color: colors.tint, fontWeight: 'bold' }}>Done</Typo>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </View>

          {/* Card 3.5: Medical Reports (Optional) */}
          <View style={[styles.card, { backgroundColor: "#FFFFFF" }]}>
            <Typo variant="body" style={{ marginBottom: 16 }}>Medical Reports (Optional)</Typo>
            <Typo variant="caption" style={{ color: "#6B7280", marginBottom: 12 }}>
              You can upload up to 5 old medical reports for reference.
            </Typo>
            
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
              {reportUris.map((uri, idx) => (
                <View key={idx} style={styles.reportPreview}>
                  <Image source={{ uri }} style={styles.reportThumb} />
                  <TouchableOpacity 
                    style={styles.removeReportBtn} 
                    onPress={() => removeReport(idx)}
                  >
                    <Feather name="x" size={14} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ))}
              {reportUris.length < 5 && (
                <TouchableOpacity onPress={pickReports} style={styles.addReportBtn}>
                  <Feather name="plus" size={24} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
          </View>


          {/* Card 4: Action & Consent */}
          <View style={[styles.card, { backgroundColor: "#FFFFFF" }]}>
            <TouchableOpacity 
              onPress={() => setAccepted(!accepted)} 
              style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 24, padding: 16, backgroundColor: accepted ? "#ECFDF5" : "#F9FAFB", borderRadius: 12, borderWidth: 1, borderColor: accepted ? "#10B981" : "#E5E7EB" }}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name={accepted ? "check-box" : "check-box-outline-blank"}
                size={24}
                color={accepted ? "#10B981" : "#9CA3AF"}
                style={{ marginRight: 12, marginTop: 2 }}
              />
              <View style={{ flex: 1 }}>
                <Typo variant="body" style={{ fontWeight: "600", color: "#374151" }}>I accept the terms & conditions</Typo>
                <Typo variant="caption" style={{ color: "#6B7280", marginTop: 4 }}>I confirm that the health details provided are currently accurate to the best of my knowledge.</Typo>
              </View>
            </TouchableOpacity>

            {!!formError && (
              <View style={{ backgroundColor: "#FEF2F2", padding: 12, borderRadius: 8, marginBottom: 16 }}>
                <Typo variant="caption" style={{ color: "#EF4444", fontWeight: "600", textAlign: "center" }}>{formError}</Typo>
              </View>
            )}

            <Button 
              label="Submit Health Assessment" 
              variant="primary" 
              onPress={handleSubmit} 
              style={{ opacity: (accepted && Object.keys(answers).length === 7) ? 1 : 0.5 }}
              disabled={!(accepted && Object.keys(answers).length === 7)}
            />
          </View>
        </View>
      )}

      {!showQuiz && (
        //Past assessments
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
            onPress={() => setHistoryExpanded(!historyExpanded)}
            activeOpacity={0.7}
          >
            <Typo variant="h2" style={[styles.historyTitle, { marginBottom: 0 }]}>Past Assessments</Typo>
            <MaterialIcons name={historyExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={28} color={colors.text} />
          </TouchableOpacity>

          {historyExpanded && (
            <View style={{ marginTop: 16 }}>
              {loadingHistory ? (
                <Typo variant="body" style={styles.historyEmpty}>Loading history...</Typo>
              ) : history.length === 0 ? (
                <Typo variant="body" style={styles.historyEmpty}>No past assessments found.</Typo>
              ) : (
                history.map((record: any, index: number) => {
                  const dateObj = new Date(record.createdAt);
                  const dateStr = dateObj.toLocaleDateString();
                  const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  return (
                    <View key={record._id || index} style={[styles.card, { backgroundColor: "#FFFFFF", padding: 16, marginBottom: 12, borderWidth: 1, borderColor: record.isEligible ? "#D1FAE5" : "#FEE2E2" }]}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Feather name="clock" size={14} color="#6B7280" style={{ marginRight: 6 }} />
                          <Typo variant="body" style={{ fontWeight: "600", color: "#374151" }}>{dateStr} at {timeStr}</Typo>
                        </View>
                        <View style={{ backgroundColor: record.isEligible ? "#ECFDF5" : "#FEF2F2", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                          <Typo variant="caption" style={{ fontWeight: "700", color: record.isEligible ? "#10B981" : "#EF4444" }}>
                            {record.isEligible ? "Eligible" : "Not Eligible"}
                          </Typo>
                        </View>
                      </View>
                      {!record.isEligible && record.reasonsForIneligibility && record.reasonsForIneligibility.length > 0 && (
                        <View style={{ marginTop: 8, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: "#EF4444", backgroundColor: "#FEF2F2", paddingVertical: 8, borderRadius: 8 }}>
                          {record.reasonsForIneligibility.map((r: string, rIdx: number) => (
                            <Typo key={rIdx} variant="caption" style={{ color: "#4B5563", fontSize: 13, marginBottom: 4 }}>• {r}</Typo>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
};


// --- UI 3 ---
const GuidanceTipsView = ({ colors, router }: any) => {
  return (
    <ScrollView contentContainerStyle={styles.viewContent} showsVerticalScrollIndicator={false}>

      <TouchableOpacity
        style={[styles.card, { backgroundColor: "#FFFFFF", flexDirection: "row", alignItems: "center", paddingVertical: 24 }]}
        onPress={() => router.push("/(user)/donor-eligibility-criteria" as any)}
      >
        <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: "#ECFDF5", alignItems: "center", justifyContent: "center", marginRight: 16 }}>
          <Feather name="check-circle" size={24} color="#10B981" />
        </View>
        <View style={{ flex: 1 }}>
          <Typo variant="body" style={[styles.boldText, { fontSize: 16 }]}>Eligibility Criteria</Typo>
          <Typo variant="caption" style={{ color: "#6B7280" }}>How can I become eligible?</Typo>
        </View>
        <Feather name="chevron-right" size={24} color="#9CA3AF" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.card, { backgroundColor: "#FFFFFF", flexDirection: "row", alignItems: "center", paddingVertical: 24 }]}
        onPress={() => router.push("/(user)/post-donation-care" as any)}
      >
        <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center", marginRight: 16 }}>
          <Feather name="heart" size={24} color="#3B82F6" />
        </View>
        <View style={{ flex: 1 }}>
          <Typo variant="body" style={[styles.boldText, { fontSize: 16 }]}>Post-Donation Care</Typo>
          <Typo variant="caption" style={{ color: "#6B7280" }}>What should I do after Donating?</Typo>
        </View>
        <Feather name="chevron-right" size={24} color="#9CA3AF" />
      </TouchableOpacity>

      <Typo variant="h2" style={styles.faqTitle}>FAQ</Typo>

      <Accordion
        title="How does the blood donation process work?"
        content="The process includes registration, medical history questions, a mini-physical, the actual donation, and a brief recovery period with snacks."
      />
      <Accordion
        title="Who can donate blood?"
        content="Generally, you must be in good health, at least 17 years old, and weigh at least 50kg."
      />
      <Accordion
        title="How often can I donate blood?"
        content="You can donate blood every 4 months."
      />
      <Accordion
        title="How long does a blood donation take?"
        content="The entire process takes about an hour, but the actual blood draw takes only 8-10 minutes."
      />
    </ScrollView>
  );
};

export default function EligibilityScreen() {
  const router = useRouter();
  const { colors } = useThemeColor();
  const [tabIndex, setTabIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [quizTaken, setQuizTaken] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const [isEligible, setIsEligible] = useState<boolean | null>(null);
  const [ineligibilityReasons, setIneligibilityReasons] = useState<string[]>([]);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const history = await api.get("/eligibility/history");
        const data = history.data;
        if (Array.isArray(data) && data.length > 0) {
          setIsEligible(data[0].isEligible);
          setIneligibilityReasons(data[0].reasonsForIneligibility || []);
          setQuizTaken(true);
        }
      } catch (error) {
        console.warn("Failed to load initial eligibility history", error);
      } finally {
        setInitializing(false);
      }
    };
    init();
  }, []);

  const handleCompleteQuiz = (eligible: boolean, reasons: string[]) => {
    setIsEligible(eligible);
    setIneligibilityReasons(reasons);
  };

  let tipLabel = "View guidance & tips to become eligible";
  let expandParam = "";
  if (ineligibilityReasons.some((r) => r.toLowerCase().includes("hemoglobin"))) {
    tipLabel = "View tips to maintain hemoglobin level";
    expandParam = "?expand=hemoglobin";
  } else if (ineligibilityReasons.some((r) => r.toLowerCase().includes("blood pressure"))) {
    tipLabel = "View tips to maintain blood pressure";
    expandParam = "?expand=bloodPressure";
  }

  const handleTipPress = () => {
    setModalVisible(false);
    router.push(`/(user)/donor-eligibility-criteria${expandParam}` as any);
  };

  return (

    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Typo variant="h2" style={styles.headerTitle}>Donor Eligibility & Guidance</Typo>
        <TouchableOpacity style={styles.filterButton}>
          <MaterialIcons name="segment" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabsContainer}>
        <SegmentedControl
          options={["Donor Info", "Check Eligibility", "Guidance & Tips"]}
          selectedIndex={tabIndex}
          onChange={setTabIndex}
        />
      </View>

      {initializing ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Typo variant="body">Checking eligibility history...</Typo>
        </View>
      ) : (
        <>
          {tabIndex === 0 && <UserInfoView colors={colors} isEligible={isEligible} router={router} setTabIndex={setTabIndex} />}
          {tabIndex === 1 && (
            <CheckEligibilityView
              colors={colors}
              onShowModal={() => setModalVisible(true)}
              quizTaken={quizTaken}
              showQuiz={showQuiz}
              showResult={showResult}
              setQuizTaken={setQuizTaken}
              setShowQuiz={setShowQuiz}
              setShowResult={setShowResult}
              isEligible={isEligible}
              ineligibilityReasons={ineligibilityReasons}
              onCompleteQuiz={handleCompleteQuiz}
              tipLabel={tipLabel}
              onTipPress={handleTipPress}
            />
          )}
          {tabIndex === 2 && <GuidanceTipsView colors={colors} router={router} />}
        </>
      )}


      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            {isEligible ? (
              // Eligible State
              <View>
                <View style={styles.modalHeader}>
                  <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#10B981", alignItems: "center", justifyContent: "center" }}>
                    <Feather name="check" size={32} color="#FFFFFF" />
                  </View>
                  <Typo variant="h2" style={[styles.modalTitle, { color: "#10B981" }]}>
                    Eligible
                  </Typo>
                </View>

                <Typo variant="body" style={styles.modalDesc}>
                  Great news! You are eligible to donate blood.
                </Typo>

                <View style={{ backgroundColor: "#F0FDF4", padding: 16, borderRadius: 12, marginBottom: 24, flexDirection: "row", alignItems: "center" }}>
                  <MaterialCommunityIcons name="calendar-heart" size={24} color="#10B981" style={{ marginRight: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Typo variant="body" style={{ color: "#065F46", fontWeight: "600" }}>
                      You can make a difference
                    </Typo>
                    <Typo variant="caption" style={{ color: "#047857", marginTop: 2 }}>
                      Schedule your appointment and help save lives
                    </Typo>
                  </View>
                </View>

                <Button
                  label="Schedule Appointment"
                  variant="primary"
                  onPress={() => {}} // TODO: Navigate to appointment scheduling (camp management)
                  style={{ backgroundColor: "#10B981", marginBottom: 12 }}
                />
                <Button
                  label="Maybe Later"
                  variant="secondary"
                  onPress={() => setModalVisible(false)}
                  style={{ backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#10B981" }}
                />
              </View>
            ) : (
              // Not Eligible State
              <View>
                <View style={styles.modalHeader}>
                  <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#EF4444", alignItems: "center", justifyContent: "center" }}>
                    <Feather name="x" size={32} color="#FFFFFF" />
                  </View>
                  <Typo variant="h2" style={[styles.modalTitle, { color: "#EF4444" }]}>
                    Not Eligible
                  </Typo>
                </View>

                <Typo variant="body" style={styles.modalDesc}>
                  You are not eligible for blood donation due to:
                </Typo>

                {ineligibilityReasons && ineligibilityReasons.length > 0 && (
                  <View style={{ marginBottom: 24 }}>
                    {ineligibilityReasons.map((reason: string, idx: number) => (
                      <View key={idx} style={{ backgroundColor: "#FEF2F2", padding: 12, borderRadius: 8, marginBottom: 8, flexDirection: "row", alignItems: "center" }}>
                        <FontAwesome name="exclamation-triangle" size={16} color="#EF4444" style={{ marginRight: 8 }} />
                        <Typo variant="body" style={{ color: "#991B1B", flex: 1 }}>
                          {reason}
                        </Typo>
                      </View>
                    ))}
                  </View>
                )}

                <Button
                  label="OK"
                  variant="primary"
                  onPress={() => setModalVisible(false)}
                  style={{ backgroundColor: "#EF4444", marginBottom: 12 }}
                />
                <Button
                  label={tipLabel}
                  variant="secondary"
                  onPress={handleTipPress}
                  style={{ backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EF4444" }}
                />
              </View>
            )}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  historyEmpty: {
    textAlign: "center",
    color: "#9CA3AF",
    paddingVertical: 20,
  },
  reportPreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  reportThumb: {
    width: "100%",
    height: "100%",
  },
  removeReportBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  addReportBtn: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: { padding: 8 },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 20 },
  filterButton: { padding: 8 },
  tabsContainer: { paddingHorizontal: 16, marginBottom: 8 },
  viewContent: { paddingHorizontal: 16, paddingBottom: 32 },

  card: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  boldText: { fontWeight: "700", marginBottom: 4, },
  grayText: { color: "#6B7280", marginBottom: 2 },
  statusRow: { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 8 },
  statusText: { fontSize: 20, fontWeight: "700" },
  rowCards: { flexDirection: "row", marginBottom: 16 },
  grayTextSmall: { color: "#6B7280", fontSize: 10, fontWeight: "600", textTransform: "uppercase" },
  historyItem: { paddingVertical: 12 },
  historyDivider: { height: 1, backgroundColor: "#E5E7EB" },

  questionSection: { marginBottom: 16 },
  questionText: { marginBottom: 8 },
  radioGroup: { flexDirection: "row", gap: 32, paddingLeft: 16 },
  radioOption: { flexDirection: "row", alignItems: "center", gap: 8 },
  radioCircle: { width: 16, height: 16, borderRadius: 8, backgroundColor: "#E5E7EB" },

  inputSection: { marginBottom: 16 },
  inputLabel: { marginBottom: 8, fontWeight: "600" },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#111827",
    backgroundColor: "#FFFFFF",
  },
  inputHint: { color: "#6B7280" },
  errorText: { color: "#EF4444", marginBottom: 12 },
  helperText: { color: "#6B7280", marginBottom: 12 },
  sectionTitle: { fontWeight: "600", color: "#374151", marginBottom: 12 },

  termsRow: { flexDirection: "row", alignItems: "center", marginTop: 16, gap: 12 },
  checkboxContainer: { padding: 4 },
  readTerms: { textDecorationLine: "underline", color: "#6B7280", marginTop: 2 },
  submitBtn: { marginTop: 32 },

  tipCard: {
    flexDirection: "row",
    padding: 24,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  tipCardText: { flex: 1, fontSize: 18, fontWeight: "700", paddingRight: 16 },
  faqTitle: { textAlign: "center", marginTop: 32, marginBottom: 24, fontSize: 30, fontWeight: "700", },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    padding: 24,
    borderRadius: 24,
    alignItems: "center",
  },
  modalHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  modalTitle: { fontSize: 24, fontWeight: "700" },
  modalDesc: { textAlign: "center", marginBottom: 32, color: "#4B5563" },
  modalBtnMain: { width: "100%", marginBottom: 16 },
  modalBtnSec: { width: "100%", backgroundColor: "#F3F4F6", borderRadius: 24 },

  quizIcon: { marginBottom: 16 },
  quizTitle: { textAlign: "center", fontSize: 24, fontWeight: "700" },
  quizDescription: { lineHeight: 22, color: "#6B7280" },
  quizButton: { paddingHorizontal: 32, minWidth: 200 },

  resultHeader: { alignItems: "center", marginBottom: 24 },
  resultIcon: { marginBottom: 12 },
  resultTitle: { fontSize: 24, fontWeight: "700" },
  resultContent: { paddingHorizontal: 8 },
  resultLabel: { fontWeight: "600", marginBottom: 4 },
  resultReason: { fontSize: 18, fontWeight: "700", marginBottom: 24, color: "#374151" },
  resultDetails: { backgroundColor: "#F9FAFB", padding: 16, borderRadius: 12, marginBottom: 24 },
  resultDetailsTitle: { fontWeight: "600", marginBottom: 12 },
  resultItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  resultItemLabel: { color: "#6B7280" },
  resultItemValue: { fontWeight: "600" },
  resultActions: { gap: 12 },
  resultActionButton: { flex: 1 },

  historyTitle: { fontSize: 20, fontWeight: "700", marginBottom: 16 },
  historyEmpty: { color: "#6B7280", fontStyle: "italic", marginTop: 8 },
  historyCard: { padding: 16, backgroundColor: "#F9FAFB", borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: "#E5E7EB" },
  historyRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  historyDate: { fontWeight: "600", color: "#374151" },
  historyStatus: { fontWeight: "700" },
  historyReasons: { marginTop: 4, paddingLeft: 8, borderLeftWidth: 2, borderLeftColor: "#EF4444" },
  historyReasonItem: { color: "#4B5563", fontSize: 13, marginBottom: 2 },
});
