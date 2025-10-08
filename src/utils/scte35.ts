// SCTE-35 Message Construction and Base64 Encoding
export interface SCTE35SpliceInsert {
  splice_event_id: number;
  out_of_network: boolean;
  break_duration?: number; // Only for CUE-OUT
  splice_time?: {
    pts_time: number;
  };
}

export class SCTE35Encoder {
  /**
   * Constructs a SCTE-35 splice_insert command for CUE-OUT (Ad Start)
   */
  static createCueOut(eventId: number, duration: number, preRoll: number = 0): string {
    const spliceInsert: SCTE35SpliceInsert = {
      splice_event_id: eventId,
      out_of_network: true,
      break_duration: duration,
    };

    // Add splice_time if pre-roll is specified
    if (preRoll > 0) {
      spliceInsert.splice_time = {
        pts_time: preRoll * 90000, // Convert seconds to PTS (90kHz)
      };
    }

    return this.encodeToBase64(spliceInsert);
  }

  /**
   * Constructs a SCTE-35 splice_insert command for CUE-IN (Ad Stop)
   */
  static createCueIn(eventId: number): string {
    const spliceInsert: SCTE35SpliceInsert = {
      splice_event_id: eventId,
      out_of_network: false,
    };

    return this.encodeToBase64(spliceInsert);
  }

  /**
   * Encodes the SCTE-35 message to Base64 for OME API
   */
  private static encodeToBase64(message: SCTE35SpliceInsert): string {
    // In a real implementation, this would construct the actual SCTE-35 binary message
    // For this demo, we'll create a JSON representation and encode it
    const jsonMessage = JSON.stringify(message);
    return btoa(jsonMessage);
  }

  /**
   * Decodes Base64 SCTE-35 message back to JSON for verification
   */
  static decodeFromBase64(encodedMessage: string): SCTE35SpliceInsert {
    try {
      const jsonMessage = atob(encodedMessage);
      return JSON.parse(jsonMessage);
    } catch (error) {
      throw new Error('Invalid SCTE-35 message format');
    }
  }

  /**
   * Validates SCTE-35 message structure
   */
  static validateMessage(message: SCTE35SpliceInsert): boolean {
    if (!message.splice_event_id || typeof message.splice_event_id !== 'number') {
      return false;
    }

    if (typeof message.out_of_network !== 'boolean') {
      return false;
    }

    // For CUE-OUT, break_duration should be present and positive
    if (message.out_of_network && (!message.break_duration || message.break_duration <= 0)) {
      return false;
    }

    return true;
  }
}
