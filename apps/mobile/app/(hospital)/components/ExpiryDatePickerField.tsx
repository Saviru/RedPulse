import React, { useMemo, useState } from "react";
import { Modal, Platform, TouchableOpacity, View } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { MaterialIcons } from "@expo/vector-icons";

import { Input, Button, Typo } from "@/packages/ui/components/ui";
import { useThemeColor } from "@/packages/ui/hooks";
import { isValidYmd } from "@/apps/mobile/src/lib/bloodValidation";

function toYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseYmd(ymd: string): Date | null {
  if (!isValidYmd(ymd)) return null;
  return new Date(Number(ymd.slice(0, 4)), Number(ymd.slice(5, 7)) - 1, Number(ymd.slice(8, 10)));
}

function tomorrowLocalDate(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return d;
}

type Props = {
  value: string;
  onChangeValue: (ymd: string) => void;
  containerStyle?: object;
};

export default function ExpiryDatePickerField({ value, onChangeValue, containerStyle }: Props) {
  const { colors, theme } = useThemeColor();
  const [open, setOpen] = useState(false);
  const [pickerDate, setPickerDate] = useState<Date>(tomorrowLocalDate);
  const [webPickerValue, setWebPickerValue] = useState("");

  const minExpiryDate = useMemo(() => tomorrowLocalDate(), []);
  const minExpiryYmd = useMemo(() => toYmd(minExpiryDate), [minExpiryDate]);

  function applyDate(date: Date) {
    const candidate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (candidate < minExpiryDate) return;
    onChangeValue(toYmd(candidate));
  }

  function openPicker() {
    const parsed = parseYmd(value);
    const next = parsed && parsed >= minExpiryDate ? parsed : minExpiryDate;
    setPickerDate(next);
    setWebPickerValue(parsed ? toYmd(parsed) : minExpiryYmd);
    setOpen(true);
  }

  function onNativeChange(event: DateTimePickerEvent, selectedDate?: Date) {
    if (Platform.OS === "android") {
      setOpen(false);
    }
    if (event.type !== "set" || !selectedDate) return;
    setPickerDate(selectedDate);
    applyDate(selectedDate);
  }

  return (
    <>
      <TouchableOpacity onPress={openPicker} activeOpacity={0.9}>
        <View pointerEvents="none">
          <Input
            placeholder={minExpiryYmd}
            value={value}
            onChangeText={() => {}}
            leftIcon={<MaterialIcons name="schedule" size={20} color={colors.icon} />}
            containerStyle={containerStyle}
            editable={false}
          />
        </View>
      </TouchableOpacity>

      {open && Platform.OS === "android" ? (
        <DateTimePicker
          value={pickerDate}
          mode="date"
          display="calendar"
          minimumDate={minExpiryDate}
          onChange={onNativeChange}
        />
      ) : null}

      <Modal visible={open && Platform.OS === "ios"} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View
            style={{
              backgroundColor: theme === "dark" ? colors.surface : "#FFF",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              paddingBottom: 32,
            }}
          >
            <Typo variant="h2" style={{ fontWeight: "bold", marginBottom: 12 }}>
              Select Expiry Date
            </Typo>
            <DateTimePicker
              value={pickerDate}
              mode="date"
              display="inline"
              minimumDate={minExpiryDate}
              onChange={onNativeChange}
            />
            <View style={{ flexDirection: "row", marginTop: 16 }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Button variant="secondary" label="Cancel" onPress={() => setOpen(false)} />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Button
                  variant="primary"
                  label="Use Date"
                  onPress={() => {
                    applyDate(pickerDate);
                    setOpen(false);
                  }}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={open && Platform.OS === "web"} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 }}>
          <View
            style={{
              backgroundColor: theme === "dark" ? colors.surface : "#FFF",
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Typo variant="h2" style={{ fontWeight: "bold", marginBottom: 12 }}>
              Select Expiry Date
            </Typo>
            <input
              type="date"
              value={webPickerValue}
              min={minExpiryYmd}
              onChange={(e) => setWebPickerValue(e.currentTarget.value)}
              style={{
                width: "100%",
                height: 44,
                borderRadius: 10,
                border: `1px solid ${colors.border}`,
                padding: "8px 10px",
                background: theme === "dark" ? colors.surface : "#FFF",
                color: colors.text,
                marginBottom: 16,
              }}
            />
            <View style={{ flexDirection: "row" }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Button variant="secondary" label="Cancel" onPress={() => setOpen(false)} />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Button
                  variant="primary"
                  label="Use Date"
                  onPress={() => {
                    const parsed = parseYmd(webPickerValue);
                    if (parsed) applyDate(parsed);
                    setOpen(false);
                  }}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

