/**
 * Copyright 2019 Novage LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { FastTracker } from "../lib/fast-tracker";
import { PeerContext } from "../lib/tracker";
import { expect } from "chai";
import { mock, instance, anything, verify, capture, resetCalls } from "ts-mockito";

// tslint:disable:no-useless-cast
// tslint:disable:no-use-of-empty-return-value
// tslint:disable:no-unused-expression
// tslint:disable:no-big-function
class PeerContextClass implements PeerContext {
    public id?: string;
    public sendMessage: (json: any) => void = () => {};
}

describe("announce", () => {
    it("should add peers to swarms on announce", () => {

        const tracker = new FastTracker();
        const peers: PeerContext[] = [];

        peers.push({
            sendMessage: (json: any) => {},
        });

        let announceMessage: any = {
            action: "announce",
            event: "started",
            info_hash: "swarm1",
            peer_id: "0",
            offers: new Array<any>(),
            numwant: 100,
        };

        tracker.processMessage(announceMessage, peers[0]);
        expect(tracker.swarms).to.have.all.keys("swarm1");
        expect(tracker.swarms.get("swarm1")!.peers).to.have.all.keys("0");
        expect(tracker.swarms.get("swarm1")!.peers.get("0")).to.equal(peers[0]);

        peers.push({
            sendMessage: (json: any) => {},
        });

        announceMessage = {
            action: "announce",
            info_hash: "swarm1",
            peer_id: "1",
            offers: new Array<any>(),
            numwant: 100,
        };

        tracker.processMessage(announceMessage, peers[1]);
        expect(tracker.swarms).to.have.all.keys("swarm1");
        expect(tracker.swarms.get("swarm1")!.peers).to.have.all.keys("0", "1");
        expect(tracker.swarms.get("swarm1")!.peers.get("0")).to.equal(peers[0]);
        expect(tracker.swarms.get("swarm1")!.peers.get("1")).to.equal(peers[1]);

        announceMessage = {
            action: "announce",
            event: "started",
            info_hash: "swarm1",
            peer_id: "1",
            offers: new Array<any>(),
            numwant: 100,
        };

        tracker.processMessage(announceMessage, peers[1]);
        expect(tracker.swarms).to.have.all.keys("swarm1");
        expect(tracker.swarms.get("swarm1")!.peers).to.have.all.keys("0", "1");
        expect(tracker.swarms.get("swarm1")!.peers.get("0")).to.equal(peers[0]);
        expect(tracker.swarms.get("swarm1")!.peers.get("1")).to.equal(peers[1]);

        peers.push({
            sendMessage: (json: any) => {},
        });

        announceMessage = {
            action: "announce",
            event: "completed",
            info_hash: "swarm2",
            peer_id: "2_0",
            offers: new Array<any>(),
            numwant: 100,
        };

        tracker.processMessage(announceMessage, peers[2]);
        expect(tracker.swarms).to.have.all.keys("swarm1", "swarm2");
        expect(tracker.swarms.get("swarm1")!.peers).to.have.all.keys("0", "1");
        expect(tracker.swarms.get("swarm1")!.peers.get("0")).to.equal(peers[0]);
        expect(tracker.swarms.get("swarm1")!.peers.get("1")).to.equal(peers[1]);
        expect(tracker.swarms.get("swarm2")!.peers).to.have.all.keys("2_0");
        expect(tracker.swarms.get("swarm2")!.peers.get("2_0")).to.equal(peers[2]);

        peers.push({
            sendMessage: (json: any) => {},
        });

        announceMessage = {
            action: "announce",
            event: "completed",
            info_hash: "swarm2",
            peer_id: "2_1",
            offers: new Array<any>(),
            numwant: 100,
        };

        tracker.processMessage(announceMessage, peers[3]);
        expect(tracker.swarms).to.have.all.keys("swarm1", "swarm2");
        expect(tracker.swarms.get("swarm1")!.peers).to.have.all.keys("0", "1");
        expect(tracker.swarms.get("swarm1")!.peers.get("0")).to.equal(peers[0]);
        expect(tracker.swarms.get("swarm1")!.peers.get("1")).to.equal(peers[1]);
        expect(tracker.swarms.get("swarm2")!.peers).to.have.all.keys("2_0", "2_1");
        expect(tracker.swarms.get("swarm2")!.peers.get("2_0")).to.equal(peers[2]);
        expect(tracker.swarms.get("swarm2")!.peers.get("2_1")).to.equal(peers[3]);
    });

    it("should send offers to peers in the swarm", () => {
        const tracker = new FastTracker();

        const offers: any[] = [];
        for (let i = 0; i < 10; i++) {
            offers.push({
                offer: { sdp: "x" },
                offer_id: "y",
            });
        }

        const mockedPeer0 = mock(PeerContextClass);
        const peer0 = instance(mockedPeer0);
        peer0.id = undefined;
        let announceMessage: any = {
            action: "announce",
            event: "started",
            info_hash: "swarm1",
            peer_id: "0",
            offers: offers,
            numwant: offers.length,
        };

        tracker.processMessage(announceMessage, peer0);

        verify(mockedPeer0.sendMessage(anything())).once();
        let [json] = capture(mockedPeer0.sendMessage).first();
        expect(json.info_hash).to.be.equal("swarm1");
        expect(json.complete).to.be.equal(0);
        expect(json.incomplete).to.be.equal(1);

        resetCalls(mockedPeer0);

        const mockedPeer1 = mock(PeerContextClass);
        const peer1 = instance(mockedPeer1);
        peer1.id = undefined;
        announceMessage = {
            action: "announce",
            event: "completed",
            info_hash: "swarm1",
            peer_id: "1",
            offers: offers,
            numwant: offers.length,
        };

        tracker.processMessage(announceMessage, peer1);

        verify(mockedPeer1.sendMessage(anything())).once();
        [json] = capture(mockedPeer1.sendMessage).first();
        expect(json.action).to.be.equal("announce");
        expect(json.info_hash).to.be.equal("swarm1");
        expect(json.complete).to.be.equal(1);
        expect(json.incomplete).to.be.equal(1);

        verify(mockedPeer0.sendMessage(anything())).once();
        [json] = capture(mockedPeer0.sendMessage).first();
        expect(json.action).to.be.equal("announce");
        expect(json.info_hash).to.be.equal("swarm1");
        expect(json.peer_id).to.be.equal("1");
        expect(json.offer_id).to.be.equal("y");
        expect(json.offer).to.exist;
        expect(json.offer.type).to.be.equal("offer");
        expect(json.offer.sdp).to.be.equal("x");

        resetCalls(mockedPeer0);
        resetCalls(mockedPeer1);

        const mockedPeer2 = mock(PeerContextClass);
        const peer2 = instance(mockedPeer2);
        peer2.id = undefined;
        announceMessage = {
            action: "announce",
            event: "started",
            info_hash: "swarm2",
            peer_id: "2",
            offers: offers,
            numwant: offers.length,
        };

        tracker.processMessage(announceMessage, peer2);

        verify(mockedPeer2.sendMessage(anything())).once();
        [json] = capture(mockedPeer2.sendMessage).first();
        expect(json.action).to.be.equal("announce");
        expect(json.info_hash).to.be.equal("swarm2");
        expect(json.complete).to.be.equal(0);
        expect(json.incomplete).to.be.equal(1);

        verify(mockedPeer0.sendMessage(anything())).never();
        verify(mockedPeer1.sendMessage(anything())).never();

        resetCalls(mockedPeer0);
        resetCalls(mockedPeer1);
        resetCalls(mockedPeer2);

        const mockedPeer3 = mock(PeerContextClass);
        const peer3 = instance(mockedPeer3);
        peer3.id = undefined;
        announceMessage = {
            action: "announce",
            event: "completed",
            info_hash: "swarm2",
            peer_id: "3",
            offers: offers,
            numwant: offers.length,
        };

        tracker.processMessage(announceMessage, peer3);

        verify(mockedPeer3.sendMessage(anything())).once();
        const [json3] = capture(mockedPeer3.sendMessage).first();
        expect(json.action).to.be.equal("announce");
        expect(json3.info_hash).to.be.equal("swarm2");
        expect(json3.complete).to.be.equal(1);
        expect(json3.incomplete).to.be.equal(1);

        verify(mockedPeer0.sendMessage(anything())).never();
        verify(mockedPeer1.sendMessage(anything())).never();
        verify(mockedPeer2.sendMessage(anything())).once();
        [json] = capture(mockedPeer2.sendMessage).first();
        expect(json.action).to.be.equal("announce");
        expect(json.info_hash).to.be.equal("swarm2");
        expect(json.peer_id).to.be.equal("3");
        expect(json.offer_id).to.be.equal("y");
        expect(json.offer).to.exist;
        expect(json.offer.type).to.be.equal("offer");
        expect(json.offer.sdp).to.be.equal("x");

        resetCalls(mockedPeer0);
        resetCalls(mockedPeer1);
        resetCalls(mockedPeer2);
        resetCalls(mockedPeer3);

        const mockedPeer4 = mock(PeerContextClass);
        const peer4 = instance(mockedPeer4);
        peer4.id = undefined;
        announceMessage = {
            action: "announce",
            event: "completed",
            info_hash: "swarm2",
            peer_id: "4",
            offers: offers,
            numwant: 1,
        };

        tracker.processMessage(announceMessage, peer4);

        verify(mockedPeer4.sendMessage(anything())).once();
        [json] = capture(mockedPeer4.sendMessage).first();
        expect(json.info_hash).to.be.equal("swarm2");
        expect(json.complete).to.be.equal(2);
        expect(json.incomplete).to.be.equal(1);

        verify(mockedPeer0.sendMessage(anything())).never();
        verify(mockedPeer1.sendMessage(anything())).never();

        try {
            verify(mockedPeer2.sendMessage(anything())).once();
            verify(mockedPeer3.sendMessage(anything())).never();
            [json] = capture(mockedPeer2.sendMessage).first();
        } catch {
            verify(mockedPeer3.sendMessage(anything())).once();
            verify(mockedPeer2.sendMessage(anything())).never();
            [json] = capture(mockedPeer3.sendMessage).first();
        }
        expect(json.action).to.be.equal("announce");
        expect(json.info_hash).to.be.equal("swarm2");
        expect(json.peer_id).to.be.equal("4");
        expect(json.offer_id).to.be.equal("y");
        expect(json.offer).to.exist;
        expect(json.offer.type).to.be.equal("offer");
        expect(json.offer.sdp).to.be.equal("x");
    });
});
